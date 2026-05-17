const mongoose = require("mongoose");
const Booking = require("../models/booking.js");
const Listing = require("../models/listing.js");
const {hasBookingConflict, stayHasCompleted} = require("../utils/bookings.js");
const {normalizeRating, parseBoolean} = require("../utils/ratings.js");

function buildSafetyTags(body = {}) {
    return {
        lighting: parseBoolean(body.lighting),
        hostBehavior: parseBoolean(body.hostBehavior),
        neighborhood: parseBoolean(body.neighborhood),
        privacy: parseBoolean(body.privacy),
        transportAccess: parseBoolean(body.transportAccess),
    };
}

async function index(req, res) {
    const allBookings = await Booking.find({guest: req.user._id})
        .populate("listing")
        .populate({path: "owner", select: "username email phoneNumber"})
        .sort({createdAt: -1});

    const now = new Date();
    // Split into upcoming (future or pending) and past (checkout already passed)
    const upcomingBookings = allBookings.filter(
        (b) => b.status === "pending" || (b.status === "accepted" && new Date(b.checkOut) > now)
    );
    const pastBookings = allBookings.filter(
        (b) => b.status === "cancelled" || b.status === "rejected" || (b.status === "accepted" && new Date(b.checkOut) <= now)
    );

    res.render("bookings/index.ejs", {upcomingBookings, pastBookings});
}

async function cancel(req, res) {
    const {id} = req.params;
    const booking = await Booking.findById(id);

    if (booking && booking.guest.equals(req.user._id) && booking.status === "pending") {
        booking.status = "cancelled";
        booking.reviewedAt = new Date();
        await booking.save();
        req.flash("success", "Booking cancelled successfully.");
    }

    res.redirect(req.get("referer") || "/bookings");
}

async function rateWomenSafety(req, res) {
    const {id} = req.params;
    const rating = normalizeRating(req.body.rating);
    const tags = buildSafetyTags(req.body.tags);

    if (!rating || req.user.gender !== "female") {
        return res.redirect(req.get("referer") || "/bookings");
    }

    const booking = await Booking.findOneAndUpdate({
        _id: id,
        guest: req.user._id,
        status: "accepted",
        womenSafetyRating: {$exists: false},
        checkOut: {$lte: new Date()},
    }, {
        $set: {
            womenSafetyRating: rating,
            womenSafetyTags: tags,
        },
    }, {new: true}).populate("listing");

    if (!booking || !booking.listing || booking.listing.status !== "approved") {
        return res.redirect(req.get("referer") || "/bookings");
    }

    await Listing.findOneAndUpdate({
        _id: booking.listing._id,
        "womenSafetyRating.ratings.booking": {$ne: booking._id},
    }, {
        $push: {
            "womenSafetyRating.ratings": {
                user: req.user._id,
                booking: booking._id,
                rating,
                tags,
            },
        },
    });

    const aggregate = await Listing.aggregate([
        {$match: {_id: new mongoose.Types.ObjectId(booking.listing._id)}},
        {$unwind: {path: "$womenSafetyRating.ratings", preserveNullAndEmptyArrays: false}},
        {$group: {_id: "$_id", average: {$avg: "$womenSafetyRating.ratings.rating"}, count: {$sum: 1}}},
    ]);
    const stats = aggregate[0] || {average: 0, count: 0};

    await Listing.findByIdAndUpdate(booking.listing._id, {
        "womenSafetyRating.average": Math.round(stats.average * 10) / 10,
        "womenSafetyRating.count": stats.count,
    });

    req.flash("success", "Women safety rating submitted. Thank you!");
    res.redirect(req.get("referer") || "/bookings");
}

async function ownerBookings(req, res) {
    const pendingBookings = await Booking.find({owner: req.user._id, status: "pending"})
        .populate("listing")
        .populate({path: "guest", select: "username email gender"})
        .sort({createdAt: -1});
    const bookingHistory = await Booking.find({owner: req.user._id, status: {$ne: "pending"}})
        .populate("listing")
        .populate({path: "guest", select: "username email gender"})
        .sort({reviewedAt: -1, createdAt: -1});

    res.render("bookings/owner.ejs", {pendingBookings, bookingHistory});
}

async function ownerCalendar(req, res) {
    const bookings = await Booking.find({
        owner: req.user._id,
        status: {$in: ["pending", "accepted"]},
    })
        .populate("listing")
        .populate("guest")
        .sort({checkIn: 1});

    res.render("bookings/calendar.ejs", {bookings});
}

async function accept(req, res) {
    const {id} = req.params;
    const booking = await Booking.findById(id);

    if (!booking || !booking.owner.equals(req.user._id)) {
        return res.redirect("/owner/bookings");
    }

    const hasConflict = await hasBookingConflict(booking.listing, booking.checkIn, booking.checkOut, booking._id);
    if (hasConflict) {
        booking.status = "rejected";
        booking.reviewedAt = new Date();
        await booking.save();
        req.flash("error", "Booking could not be accepted — dates are no longer available.");
        return res.redirect("/owner/bookings");
    }

    booking.status = "accepted";
    booking.reviewedAt = new Date();
    await booking.save();

    const rejected = await Booking.find({
        _id: {$ne: booking._id},
        listing: booking.listing,
        status: "pending",
        checkIn: {$lt: booking.checkOut},
        checkOut: {$gt: booking.checkIn},
    });

    await Booking.updateMany({
        _id: {$in: rejected.map((entry) => entry._id)},
    }, {
        status: "rejected",
        reviewedAt: new Date(),
    });


    req.flash("success", "Booking accepted successfully.");
    res.redirect("/owner/bookings");
}

async function reject(req, res) {
    const {id} = req.params;
    const booking = await Booking.findById(id);

    if (booking && booking.owner.equals(req.user._id)) {
        booking.status = "rejected";
        booking.reviewedAt = new Date();
        await booking.save();
        req.flash("success", "Booking rejected.");
    }

    res.redirect("/owner/bookings");
}

module.exports = {
    accept,
    cancel,
    index,
    ownerBookings,
    ownerCalendar,
    rateWomenSafety,
    reject,
};
