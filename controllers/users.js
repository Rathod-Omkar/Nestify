const Booking = require("../models/booking.js");
const Listing = require("../models/listing.js");
const User = require("../models/user.js");
const {buildUploadedFile} = require("../utils/uploads.js");

function signupForm(req, res) {
    res.render("users/signup.ejs", {error: null});
}

async function signup(req, res) {
    try {
        const {username, email, password, gender, phoneNumber} = req.body.user;
        const user = new User({username, email, gender, phoneNumber});

        const registeredUser = await User.register(user, password);
        req.login(registeredUser, (err) => {
            if (err) {
                return res.status(400).render("users/signup.ejs", {error: "Could not log you in after signup."});
            }

            res.redirect("/dashboard");
        });
    } catch (err) {
        const error = err.name === "UserExistsError" || err.code === 11000 ? "Email already exists." : "Could not create your account.";
        res.status(400).render("users/signup.ejs", {error});
    }
}

function loginForm(req, res) {
    res.render("users/login.ejs", {error: null});
}

async function login(req, res) {
    const {email, password} = req.body.user;

    User.authenticate()(email.toLowerCase(), password, (err, user) => {
        if (err || !user) {
            return res.status(401).render("users/login.ejs", {error: "Invalid email or password."});
        }

        req.login(user, (loginErr) => {
            if (loginErr) {
                return res.status(401).render("users/login.ejs", {error: "Could not log you in."});
            }

            res.redirect("/dashboard");
        });
    });
}

function logout(req, res) {
    req.logout((err) => {
        if (err) {
            return res.redirect("/listings");
        }

        res.redirect("/listings");
    });
}

async function pendingListings(req, res) {
    const pendingListings = await Listing.find({
        UserID: req.user._id,
        status: {$in: ["pending", "rejected"]},
    }).sort({_id: -1});

    res.render("listings/pending.ejs", {pendingListings});
}

async function settingsForm(req, res) {
    res.render("users/settings.ejs", {error: null, success: null});
}

async function updateSettings(req, res) {
    try {
        const {username, email, gender, phoneNumber, currentPassword, newPassword} = req.body.user;
        const user = await User.findById(req.user._id);

        user.username = username;
        user.email = email.toLowerCase();
        user.gender = gender;
        user.phoneNumber = phoneNumber;

        if (req.file) {
            user.profileImage = buildUploadedFile(req.file);
        }

        if (newPassword) {
            if (!currentPassword) {
                return res.status(400).render("users/settings.ejs", {error: "Enter your current password to change password.", success: null});
            }

            await user.changePassword(currentPassword, newPassword);
        }

        await user.save();
        req.login(user, (err) => {
            if (err) {
                return res.status(400).render("users/settings.ejs", {error: "Profile updated, but could not refresh your session.", success: null});
            }

            res.locals.currUser = user;
            res.render("users/settings.ejs", {error: null, success: "Profile updated successfully."});
        });
    } catch (err) {
        const error = err.name === "UserExistsError" || err.code === 11000 ? "Email already exists." : "Could not update profile. Check your current password and try again.";
        res.status(400).render("users/settings.ejs", {error, success: null});
    }
}


module.exports = {
    login,
    loginForm,
    logout,
    pendingListings,
    settingsForm,
    signup,
    signupForm,
    updateSettings,
};
