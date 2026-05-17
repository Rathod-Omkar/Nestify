const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose").default;

const adminSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        unique: true,
    },
    role: {
        type: String,
        enum: ["super-admin", "admin"],
        default: "admin",
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin",
    },
});

adminSchema.plugin(passportLocalMongoose, { usernameField: "email" });

const Admin = mongoose.model("Admin", adminSchema);
module.exports = Admin;
