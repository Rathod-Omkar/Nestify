const mongoose = require("mongoose");

const listingSchema = new mongoose.Schema({
    title:{
        type:String,
        required: true,
    },
    description: String,
    image:{
        type:Object,
        default: {
            url: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6",
            filename: "default-listing-image",
        },
        set: (v)=>v === ""? {
            url: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6",
            filename: "default-listing-image",
        } : v,
    },
    images: [{
        url: String,
        filename: String,
    }],
    category: {
        type: String,
        enum: ["normal", "shared"],
        default: "normal",
    },
    meals: {
        types: [{
            type: String,
            enum: ["veg", "nonveg"],
        }],
        options: [{
            type: String,
            enum: ["breakfast", "lunch", "dinner"],
        }],
    },
    maxGuests: {
        type: Number,
        min: 1,
        default: 1,
    },
    price: Number,
    location: String,
    city: String,
    state: String,
    country: String,
    status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending",
    },
    sustainabilityRating: {
        type: Number,
        min: 0,
        max: 5,
        default: 0,
    },
    sustainabilityChecklist: {
        hasSolar: {
            type: Boolean,
            default: false,
        },
        wasteSegregation: {
            type: Boolean,
            default: false,
        },
        rainwaterHarvesting: {
            type: Boolean,
            default: false,
        },
        energyEfficientAppliances: {
            type: Boolean,
            default: false,
        },
        publicTransportAccess: {
            type: Boolean,
            default: false,
        },
        waterSavingFixtures: {
            type: Boolean,
            default: false,
        },
    },
    sustainabilityEvidence: [Object],
    sustainabilityVerified: {
        type: Boolean,
        default: false,
    },
    reviewRating: {
        average: {
            type: Number,
            min: 0,
            max: 5,
            default: 0,
        },
        count: {
            type: Number,
            default: 0,
        },
    },
    womenSafetyRating: {
        average: {
            type: Number,
            min: 0,
            max: 5,
            default: 0,
        },
        count: {
            type: Number,
            default: 0,
        },
        ratings: [{
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
            booking: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Booking",
            },
            rating: {
                type: Number,
                min: 1,
                max: 5,
            },
            tags: {
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
            createdAt: {
                type: Date,
                default: Date.now,
            },
        }],
    },
    documents: {
        aadharCard: Object,
        electricityBill: Object,
        salesDeed: Object,
    },
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin",
    },
    reviewedAt: Date,
    rejectionReason: {
        type: String,
        trim: true,
        default: "",
    },
    UserID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
});

const Listing = mongoose.model("Listing", listingSchema);
module.exports = Listing;
