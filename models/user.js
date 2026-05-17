const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose").default;

const userSchema = new mongoose.Schema({
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
    profileImage: {
        type: Object,
        default: {
            url: "/uploads/icon.png",
            filename: "icon.png",
        },
    },
    gender: {
        type: String,
        enum: ["female", "male", "other", "prefer-not-to-say"],
        default: "prefer-not-to-say",
    },
    phoneNumber: {
        type: String,
        trim: true,
        default: "",
    },
});

userSchema.plugin(passportLocalMongoose, { usernameField: "email" });

const User = mongoose.model("User", userSchema);
module.exports = User;
