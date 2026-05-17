const Listing = require("../models/listing.js");

function redirectIfLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return res.redirect("/dashboard");
    }

    next();
}

function isLoggedIn(req, res, next) {
    if (!req.isAuthenticated() && !res.locals.currAdmin) {
        return res.redirect("/signup");
    }

    next();
}

function isUserLoggedIn(req, res, next) {
    if (!req.isAuthenticated()) {
        return res.redirect("/signup");
    }

    next();
}

function redirectIfAdminLoggedIn(req, res, next) {
    if (res.locals.currAdmin) {
        return res.redirect("/admin");
    }

    next();
}

function isAdmin(req, res, next) {
    if (!res.locals.currAdmin) {
        return res.redirect("/admin/login");
    }

    next();
}

function isSuperAdmin(req, res, next) {
    if (!res.locals.currAdmin || res.locals.currAdmin.role !== "super-admin") {
        return res.redirect("/admin");
    }

    next();
}

async function isListingOwnerOrAdmin(req, res, next) {
    const { id } = req.params;
    const listing = await Listing.findById(id);

    if (!listing) {
        return res.redirect("/listings");
    }

    if (res.locals.currAdmin) {
        res.locals.listing = listing;
        return next();
    }

    if (!req.user || !listing.UserID || !listing.UserID.equals(req.user._id)) {
        return res.redirect(`/listings/${id}`);
    }

    res.locals.listing = listing;
    next();
}

module.exports = {
    isAdmin,
    isListingOwnerOrAdmin,
    isLoggedIn,
    isSuperAdmin,
    isUserLoggedIn,
    redirectIfAdminLoggedIn,
    redirectIfLoggedIn,
};
