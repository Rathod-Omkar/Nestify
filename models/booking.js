const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
    listing: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Listing",
        required: true,
    },
    guest: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    checkIn: {
        type: Date,
        required: true,
    },
    checkOut: {
        type: Date,
        required: true,
    },
    listingTitle: String,
    pricePerNight: Number,
    nights: Number,
    totalPrice: Number,
    guestCount: {
        type: Number,
        min: 1,
        default: 1,
    },
    status: {
        type: String,
        enum: ["pending", "accepted", "rejected", "cancelled"],
        default: "pending",
    },
    womenSafetyRating: {
        type: Number,
        min: 1,
        max: 5,
    },
    womenSafetyTags: {
        lighting: {
            type: Boolean,
            default: false,
        },
        hostBehavior: {
            type: Boolean,
            default: false,
        },
        neighborhood: {
            type: Boolean,
            default: false,
        },
        privacy: {
            type: Boolean,
            default: false,
        },
        transportAccess: {
            type: Boolean,
            default: false,
        },
    },
    propertyReview: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Review",
    },
    reviewedAt: Date,
}, {timestamps: true});

const Booking = mongoose.model("Booking", bookingSchema);
module.exports = Booking;
