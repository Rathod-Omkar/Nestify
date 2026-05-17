const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema({
    admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin",
        required: true,
    },
    listing: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Listing",
        required: true,
    },
    action: {
        type: String,
        enum: ["approved", "rejected"],
        required: true,
    },
    reason: {
        type: String,
        trim: true,
        default: "",
    },
    metadata: {
        type: Object,
        default: {},
    },
}, {timestamps: true});

module.exports = mongoose.model("AuditLog", auditLogSchema);
