const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const serviceSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    category: {
        type: String,
        enum: ["tour guide", "Driver", "House Help"],
        required: true,
    },
    phone: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    photo: {
        url: {
            type: String,
            default: "/uploads/icon.png",
        },
        filename: {
            type: String,
            default: "icon.png",
        },
    },
    location: {
        type: String,
        required: true,
        trim: true,
    },
    city: {
        type: String,
        required: true,
        trim: true,
    },
    country: {
        type: String,
        required: true,
        trim: true,
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
}, { timestamps: true });

const Service = mongoose.model("Service", serviceSchema);
module.exports = Service;
