require("dotenv").config();

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const session = require("express-session");
const passport = require("passport");
const ejsMate = require("ejs-mate");
const flash = require("connect-flash");

const Admin = require("./models/admin.js");
const User = require("./models/user.js");
const adminRoutes = require("./routes/admin.js");
const bookingRoutes = require("./routes/bookings.js");
const listingRoutes = require("./routes/listings.js");
const userRoutes = require("./routes/users.js");
const serviceRoutes = require("./routes/services.js");

const sessionOptions = {
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
    },
};

app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(methodOverride("_method"));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(session(sessionOptions));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Make flash messages and current user available in every view
app.use(async (req, res, next) => {
    res.locals.currUser = req.user;
    res.locals.currAdmin = null;
    res.locals.flashSuccess = req.flash("success");
    res.locals.flashError = req.flash("error");

    if (req.session.adminId) {
        res.locals.currAdmin = await Admin.findById(req.session.adminId);
    }

    next();
});

const Mongo_URL = process.env.MONGO_URL;

main()
    .then(() => {
        console.log("Database Connected!");
    })
    .catch((err) => {
        console.log("Database Error: " + err);
    });

async function main() {
    await mongoose.connect(Mongo_URL);
}

app.get("/", (req, res) => {
    if (res.locals.currAdmin) {
        return res.redirect("/admin");
    }

    if (req.isAuthenticated()) {
        return res.redirect("/dashboard");
    }

    res.redirect("/signup");
});

app.get("/dashboard", (req, res) => {
    if (!req.isAuthenticated()) return res.redirect("/login");
    res.render("dashboard.ejs");
});

app.get("/my-listings", (req, res) => {
    res.redirect("/listings/my-listings");
});

app.get("/about", (req, res) => {
    res.render("about.ejs");
});

app.get("/contact", (req, res) => {
    res.render("contact.ejs");
});

app.use("/admin", adminRoutes);
app.use("/", userRoutes);
app.use("/", bookingRoutes);
app.use("/listings", listingRoutes);
app.use("/services", serviceRoutes);

// Global error handler — catches any error passed via next(err)
app.use((err, req, res, next) => {
    console.error(err);
    const message = err.message || "An unexpected error occurred.";
    res.status(err.status || 500).render("error.ejs", { message });
});

app.listen(3000, () => {
    console.log("server is listning to port 3000");
});
