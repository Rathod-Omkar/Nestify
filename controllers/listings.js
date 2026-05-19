const mongoose = require("mongoose");
const Booking = require("../models/booking.js");
const Listing = require("../models/listing.js");
const Review = require("../models/review.js");
const {getConflictingBookings, getNightCount, getUnavailableDates, hasBookingConflict, parseBookingDate, stayHasCompleted} = require("../utils/bookings.js");
const {buildUploadedFile} = require("../utils/uploads.js");
const {calculateSustainabilityScore, parseBoolean, normalizeRating} = require("../utils/ratings.js");

const sustainabilityFields = [
    "hasSolar",
    "wasteSegregation",
    "rainwaterHarvesting",
    "energyEfficientAppliances",
    "publicTransportAccess",
    "waterSavingFixtures",
];

const sustainabilityLabels = {
    hasSolar: "Solar Power",
    wasteSegregation: "Waste Segregation",
    rainwaterHarvesting: "Rainwater Harvesting",
    energyEfficientAppliances: "Energy Efficient Appliances",
    publicTransportAccess: "Public Transport Access",
    waterSavingFixtures: "Water Saving Fixtures",
};

function buildListingQuery(req, res) {
    const query = resStatusQuery(res);
    const {location, minPrice, maxPrice, womenSafetyRating, checkIn, checkOut, category, features} = req.query;

    if (location) {
        const locationRegex = new RegExp(location.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
        query.$or = [
            {location: locationRegex},
            {city: locationRegex},
            {state: locationRegex},
            {country: locationRegex},
            {title: locationRegex}
        ];
    }

    if (minPrice || maxPrice) {
        query.price = {};
        const parsedMinPrice = Number(minPrice);
        const parsedMaxPrice = Number(maxPrice);
        if (Number.isFinite(parsedMinPrice)) query.price.$gte = parsedMinPrice;
        if (Number.isFinite(parsedMaxPrice)) query.price.$lte = parsedMaxPrice;
        if (!Object.keys(query.price).length) delete query.price;
    }

    const parsedWomenSafetyRating = Number(womenSafetyRating);
    if (Number.isFinite(parsedWomenSafetyRating)) {
        query["womenSafetyRating.average"] = {$gte: parsedWomenSafetyRating};
    }

    // Category filter
    if (category === "normal" || category === "shared") {
        query.category = category;
    }

    // Sustainability feature checkboxes filter
    if (features) {
        const featureList = Array.isArray(features) ? features : [features];
        for (const feature of featureList) {
            if (sustainabilityFields.includes(feature)) {
                query[`sustainabilityChecklist.${feature}`] = true;
            }
        }
    }

    return {query, checkIn, checkOut};
}

function resStatusQuery(res) {
    return res.locals.currAdmin ? {} : {status: "approved"};
}

// --- Input validation helper ---
function validateListing(body) {
    const {title, description, price, location, city, state, country, category, maxGuests} = body.listing || {};
    const errors = [];

    if (!title || title.trim().length < 3) errors.push("Title must be at least 3 characters.");
    if (!description || description.trim().length < 10) errors.push("Description must be at least 10 characters.");
    if (!price || isNaN(price) || Number(price) <= 0) errors.push("Price must be a positive number.");
    if (!location || location.trim().length < 2) errors.push("Please enter a valid location.");
    if (!city || city.trim().length < 2) errors.push("Please enter a valid city.");
    if (!state || state.trim().length < 2) errors.push("Please enter a valid state.");
    if (!country || country.trim().length < 2) errors.push("Please enter a valid country.");
    if (category && !["normal", "shared"].includes(category)) errors.push("Invalid listing category.");
    if (maxGuests && (isNaN(maxGuests) || Number(maxGuests) < 1)) errors.push("Max guests must be at least 1.");

    return errors;
}

async function index(req, res) {
    const {query, checkIn, checkOut} = buildListingQuery(req, res);
    let allListings = await Listing.find(query).sort({_id: -1});

    if (checkIn && checkOut) {
        const parsedCheckIn = parseBookingDate(checkIn);
        const parsedCheckOut = parseBookingDate(checkOut);

        if (!Number.isNaN(parsedCheckIn.getTime()) && !Number.isNaN(parsedCheckOut.getTime()) && parsedCheckOut > parsedCheckIn) {
            const conflictingBookings = await Booking.find({
                status: {$in: ["pending", "accepted"]},
                checkIn: {$lt: parsedCheckOut},
                checkOut: {$gt: parsedCheckIn},
            }).select("listing");
            const blockedListingIds = new Set(conflictingBookings.map((booking) => booking.listing.toString()));
            allListings = allListings.filter((listing) => !blockedListingIds.has(listing._id.toString()));
        }
    }

    res.render("listings/index.ejs", {allListings, filters: req.query, sustainabilityFields, sustainabilityLabels});
}

function newListing(req, res) {
    res.render("listings/new.ejs", {sustainabilityFields});
}

async function show(req, res) {
    const {id} = req.params;
    const listing = await Listing.findById(id).populate("UserID");
    if (!listing) {
        return res.redirect("/listings");
    }

    const isOwner = req.user && listing.UserID && listing.UserID._id.equals(req.user._id);
    if (!res.locals.currAdmin && listing.status !== "approved" && !isOwner) {
        return res.redirect("/listings");
    }

    const unavailableBookings = await getConflictingBookings(listing._id, new Date(0), new Date("9999-12-31"));
    const unavailableDates = getUnavailableDates(unavailableBookings);
    const today = new Date().toISOString().split("T")[0];
    const bookingError = req.query.bookingError || null;
    const userBooking = req.user ? await Booking.findOne({
        listing: listing._id,
        guest: req.user._id,
        status: "pending",
    }) : null;
    const reviews = await Review.find({listing: listing._id}).populate("user").sort({createdAt: -1});

    // Build combined images array for the carousel: cover image first, then extras
    const allImages = [];
    if (listing.image && listing.image.url) allImages.push(listing.image);
    if (listing.images && listing.images.length) {
        for (const img of listing.images) {
            allImages.push(img);
        }
    }

    res.render("listings/show.ejs", {listing, today, bookingError, unavailableDates, userBooking, reviews, allImages});
}

async function create(req, res) {
    if (!req.files || !req.files.listingImages || !req.files.listingImages.length || !req.files.aadharCard || !req.files.electricityBill) {
        req.flash("error", "Please upload all required files (at least one listing image, Aadhar card, electricity bill).");
        return res.redirect("/listings/new");
    }

    // Input validation
    const errors = validateListing(req.body);
    if (errors.length) {
        req.flash("error", errors[0]);
        return res.redirect("/listings/new");
    }

    const newListing = Listing(req.body.listing);

    // First uploaded image is the cover image; all go into images[]
    const uploadedImages = req.files.listingImages.map(buildUploadedFile);
    newListing.image = uploadedImages[0];
    newListing.images = uploadedImages;

    newListing.category = req.body.listing.category || "normal";
    newListing.maxGuests = Number(req.body.listing.maxGuests) || 1;

    // Meals
    const mealTypes = req.body.mealTypes ? (Array.isArray(req.body.mealTypes) ? req.body.mealTypes : [req.body.mealTypes]) : [];
    const mealOptions = req.body.mealOptions ? (Array.isArray(req.body.mealOptions) ? req.body.mealOptions : [req.body.mealOptions]) : [];
    newListing.meals = {types: mealTypes, options: mealOptions};

    newListing.documents = {
        aadharCard: req.files.aadharCard ? buildUploadedFile(req.files.aadharCard[0]) : undefined,
        electricityBill: req.files.electricityBill ? buildUploadedFile(req.files.electricityBill[0]) : undefined,
        salesDeed: req.files.salesDeed ? buildUploadedFile(req.files.salesDeed[0]) : undefined,
    };
    newListing.sustainabilityChecklist = sustainabilityFields.reduce((checklist, field) => {
        checklist[field] = parseBoolean(req.body.sustainability && req.body.sustainability[field]);
        return checklist;
    }, {});
    newListing.sustainabilityRating = calculateSustainabilityScore(newListing.sustainabilityChecklist);
    newListing.sustainabilityEvidence = (req.files.sustainabilityEvidence || []).map(buildUploadedFile);
    newListing.status = "pending";
    newListing.UserID = req.user._id;
    await newListing.save();

    req.flash("success", "Listing submitted for admin review.");
    res.redirect(`/listings/${newListing._id}`);
}

function edit(req, res) {
    res.render("listings/edit.ejs", {listing: res.locals.listing, sustainabilityFields});
}

async function update(req, res) {
    const {id} = req.params;

    // Input validation
    const errors = validateListing(req.body);
    if (errors.length) {
        req.flash("error", errors[0]);
        return res.redirect(`/listings/${id}/edit`);
    }

    const listing = await Listing.findById(id);
    if (!listing) {
        req.flash("error", "Listing not found.");
        return res.redirect("/listings");
    }

    // Update basic fields
    listing.title = req.body.listing.title;
    listing.description = req.body.listing.description;
    listing.price = req.body.listing.price;
    listing.location = req.body.listing.location;
    listing.city = req.body.listing.city;
    listing.state = req.body.listing.state;
    listing.country = req.body.listing.country;
    listing.category = req.body.listing.category || listing.category;
    listing.maxGuests = Number(req.body.listing.maxGuests) || listing.maxGuests;

    // Meals
    const mealTypes = req.body.mealTypes ? (Array.isArray(req.body.mealTypes) ? req.body.mealTypes : [req.body.mealTypes]) : [];
    const mealOptions = req.body.mealOptions ? (Array.isArray(req.body.mealOptions) ? req.body.mealOptions : [req.body.mealOptions]) : [];
    listing.meals = {types: mealTypes, options: mealOptions};

    // Sustainability checklist
    const sustainabilityBody = req.body.sustainability || {};
    listing.sustainabilityChecklist = sustainabilityFields.reduce((checklist, field) => {
        checklist[field] = parseBoolean(sustainabilityBody[field]);
        return checklist;
    }, {});
    listing.sustainabilityRating = calculateSustainabilityScore(listing.sustainabilityChecklist);

    // Remove specified images
    const removeImages = req.body.removeImages ? (Array.isArray(req.body.removeImages) ? req.body.removeImages : [req.body.removeImages]) : [];
    if (removeImages.length > 0) {
        listing.images = listing.images.filter((img) => !removeImages.includes(img.filename));
    }

    // Append newly uploaded images
    if (req.files && req.files.listingImages && req.files.listingImages.length) {
        const newImages = req.files.listingImages.map(buildUploadedFile);
        listing.images.push(...newImages);
    }

    // Update cover image to first image in array
    if (listing.images.length > 0) {
        listing.image = listing.images[0];
    }

    listing.status = "pending";
    listing.rejectionReason = "";
    listing.sustainabilityVerified = false;

    await listing.save();
    req.flash("success", "Listing updated and sent for re-review.");
    res.redirect("/listings/my-listings");
}

async function destroy(req, res) {
    const {id} = req.params;
    await Listing.findByIdAndDelete(id);
    req.flash("success", "Listing deleted.");
    res.redirect("/listings/my-listings");
}

async function myListings(req, res) {
    const listings = await Listing.find({UserID: req.user._id}).sort({_id: -1});
    res.render("listings/myListings.ejs", {listings});
}

async function createBooking(req, res) {
    const {id} = req.params;
    const listing = await Listing.findById(id);

    if (!listing || listing.status !== "approved" || !listing.UserID) {
        return res.redirect("/listings");
    }

    if (listing.UserID && listing.UserID.equals(req.user._id)) {
        return res.redirect(`/listings/${id}?bookingError=You cannot book your own property.`);
    }

    const checkIn = parseBookingDate(req.body.booking.checkIn);
    const checkOut = parseBookingDate(req.body.booking.checkOut);
    const today = parseBookingDate(new Date().toISOString().split("T")[0]);
    const nights = getNightCount(checkIn, checkOut);
    const guestCount = Math.max(1, parseInt(req.body.booking.guestCount) || 1);

    if (!req.body.booking.checkIn || !req.body.booking.checkOut || Number.isNaN(checkIn.getTime()) || Number.isNaN(checkOut.getTime()) || checkIn < today || !Number.isFinite(nights) || nights < 1) {
        return res.redirect(`/listings/${id}?bookingError=Please select valid check-in and check-out dates.`);
    }

    if (listing.maxGuests && guestCount > listing.maxGuests) {
        return res.redirect(`/listings/${id}?bookingError=This property allows a maximum of ${listing.maxGuests} guest(s).`);
    }

    const hasConflict = await hasBookingConflict(id, checkIn, checkOut);
    if (hasConflict) {
        return res.redirect(`/listings/${id}?bookingError=Those dates are already booked or waiting for owner approval.`);
    }

    await Booking.create({
        listing: listing._id,
        guest: req.user._id,
        owner: listing.UserID,
        checkIn,
        checkOut,
        listingTitle: listing.title,
        pricePerNight: listing.price,
        nights,
        totalPrice: nights * listing.price,
        guestCount,
        status: "pending",
    });

    req.flash("success", "Booking request sent! Waiting for owner approval.");
    res.redirect("/my-bookings");
}

async function createReview(req, res) {
    const {id} = req.params;
    const rating = normalizeRating(req.body.rating);
    const booking = await Booking.findOne({
        _id: req.body.bookingId,
        listing: id,
        guest: req.user._id,
        status: "accepted",
        propertyReview: {$exists: false},
    });

    if (!rating || !booking || !stayHasCompleted(booking)) {
        req.flash("error", "Review could not be submitted.");
        return res.redirect(`/listings/${id}`);
    }

    try {
        const review = await Review.create({
            listing: id,
            booking: booking._id,
            user: req.user._id,
            rating,
            comment: req.body.comment,
        });
        booking.propertyReview = review._id;
        await booking.save();

        const aggregate = await Review.aggregate([
            {$match: {listing: new mongoose.Types.ObjectId(id)}},
            {$group: {_id: "$listing", average: {$avg: "$rating"}, count: {$sum: 1}}},
        ]);
        const stats = aggregate[0] || {average: 0, count: 0};
        await Listing.findByIdAndUpdate(id, {
            reviewRating: {
                average: Math.round(stats.average * 10) / 10,
                count: stats.count,
            },
        });

        req.flash("success", "Review submitted. Thank you!");
    } catch (err) {
        if (err.code !== 11000) {
            throw err;
        }
    }

    res.redirect(`/listings/${id}`);
}

module.exports = {
    create,
    createBooking,
    createReview,
    destroy,
    edit,
    index,
    myListings,
    newListing,
    show,
    update,
};
