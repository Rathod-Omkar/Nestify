const Booking = require("../models/booking.js");
const Listing = require("../models/listing.js");
const User = require("../models/user.js");
const {buildUploadedFile} = require("../utils/uploads.js");

async function signup(req, res) {
    try {
        const {username, email, password, gender, phoneNumber} = req.body.user;

        // Validation 1: Ensure email is standard format
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).render("users/signup.ejs", {error: "Please enter a valid email address."});
        }

        // Validation 2: Ensure username is not empty
        if (!username || username.trim().length < 3) {
            return res.status(400).render("users/signup.ejs", {error: "Username must be at least 3 characters long."});
        }

        // Validation 3: Validate phone number format (must be 10 digits)
        if (phoneNumber && !/^[0-9]{10}$/.test(phoneNumber.replace(/[\s-]/g, ""))) {
            return res.status(400).render("users/signup.ejs", {error: "Please enter a valid 10-digit phone number."});
        }

        // Validation 4: Check if email is already taken
        const existingEmail = await User.findOne({ email: email.toLowerCase() });
        if (existingEmail) {
            return res.status(400).render("users/signup.ejs", {error: "This email is already registered."});
        }

        // Validation 5: Check if phone number is already registered (if supplied)
        if (phoneNumber) {
            const existingPhone = await User.findOne({ phoneNumber });
            if (existingPhone) {
                return res.status(400).render("users/signup.ejs", {error: "This phone number is already registered."});
            }
        }

        const user = new User({username, email: email.toLowerCase(), gender, phoneNumber});
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

function signupForm(req, res) {
    res.render("users/signup.ejs", {error: null});
}

function loginForm(req, res) {
    res.render("users/login.ejs", {error: null});
}

async function login(req, res) {
    const {email, password} = req.body.user;

    if (!email) {
        return res.status(400).render("users/login.ejs", {error: "Please enter your email."});
    }

    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (!userExists) {
        return res.status(401).render("users/login.ejs", {error: "No account found with this email."});
    }

    User.authenticate()(email.toLowerCase(), password, (err, user) => {
        if (err || !user) {
            return res.status(401).render("users/login.ejs", {error: "Incorrect password. Please try again."});
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

        // Validation 1: Check username length
        if (!username || username.trim().length < 3) {
            return res.status(400).render("users/settings.ejs", {error: "Name must be at least 3 characters long.", success: null});
        }

        // Validation 2: Check email format
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).render("users/settings.ejs", {error: "Please enter a valid email address.", success: null});
        }

        // Validation 3: Check phone length (must be 10 digits if provided)
        if (phoneNumber && !/^[0-9]{10}$/.test(phoneNumber.replace(/[\s-]/g, ""))) {
            return res.status(400).render("users/settings.ejs", {error: "Phone number must be exactly 10 digits.", success: null});
        }

        // Validation 4: Check if email is already taken by another user
        const existingEmail = await User.findOne({ email: email.toLowerCase(), _id: { $ne: req.user._id } });
        if (existingEmail) {
            return res.status(400).render("users/settings.ejs", {error: "This email is already registered by another account.", success: null});
        }

        // Validation 5: Check if phone is already taken by another user
        if (phoneNumber) {
            const existingPhone = await User.findOne({ phoneNumber: phoneNumber.replace(/[\s-]/g, ""), _id: { $ne: req.user._id } });
            if (existingPhone) {
                return res.status(400).render("users/settings.ejs", {error: "This phone number is already registered by another account.", success: null});
            }
        }

        const user = await User.findById(req.user._id);

        user.username = username;
        user.email = email.toLowerCase();
        user.gender = gender;
        user.phoneNumber = phoneNumber ? phoneNumber.replace(/[\s-]/g, "") : "";

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
