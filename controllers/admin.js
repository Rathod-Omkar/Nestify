const Admin = require("../models/admin.js");
const AuditLog = require("../models/auditLog.js");
const Listing = require("../models/listing.js");
const User = require("../models/user.js");
const {calculateSustainabilityScore, parseBoolean} = require("../utils/ratings.js");

const sustainabilityFields = [
    "hasSolar",
    "wasteSegregation",
    "rainwaterHarvesting",
    "energyEfficientAppliances",
    "publicTransportAccess",
    "waterSavingFixtures",
];

async function loginForm(req, res) {
    res.render("admin/login.ejs", {error: null});
}

async function login(req, res) {
    const {email, password} = req.body.admin;

    Admin.authenticate()(email.toLowerCase(), password, (err, admin) => {
        if (err || !admin) {
            return res.status(401).render("admin/login.ejs", {error: "Invalid admin email or password."});
        }

        req.session.adminId = admin._id;
        res.redirect("/admin");
    });
}

function logout(req, res) {
    req.session.adminId = null;
    res.redirect("/admin/login");
}

async function dashboard(req, res) {
    const listingCount = await Listing.countDocuments({status: "approved"});
    const pendingListingCount = await Listing.countDocuments({status: "pending"});
    const rejectedListingCount = await Listing.countDocuments({status: "rejected"});
    const userCount = await User.countDocuments();
    const adminCount = await Admin.countDocuments();
    const recentAuditLogs = await AuditLog.find()
        .populate("admin")
        .populate("listing")
        .sort({createdAt: -1})
        .limit(8);

    res.render("admin/dashboard.ejs", {listingCount, pendingListingCount, rejectedListingCount, userCount, adminCount, recentAuditLogs});
}

async function listingRequests(req, res) {
    const pendingListings = await Listing.find({status: "pending"}).populate("UserID").sort({_id: -1});
    res.render("admin/listingRequests.ejs", {pendingListings});
}

async function approveListing(req, res) {
    const {id} = req.params;

    // Build checklist from admin-submitted form (admin may adjust owner's claims)
    const adminChecklist = req.body.sustainabilityChecklist || {};
    const checklist = sustainabilityFields.reduce((acc, field) => {
        acc[field] = parseBoolean(adminChecklist[field]);
        return acc;
    }, {});
    const score = calculateSustainabilityScore(checklist);

    const listing = await Listing.findByIdAndUpdate(id, {
        status: "approved",
        rejectionReason: "",
        reviewedBy: res.locals.currAdmin._id,
        reviewedAt: new Date(),
        sustainabilityChecklist: checklist,
        sustainabilityRating: score,
        sustainabilityVerified: true,
    }, {new: true});

    await AuditLog.create({
        admin: res.locals.currAdmin._id,
        listing: id,
        action: "approved",
        metadata: {
            sustainabilityRating: listing ? listing.sustainabilityRating : undefined,
            checklist: listing ? listing.sustainabilityChecklist : undefined,
        },
    });


    req.flash("success", "Listing approved and is now live.");
    res.redirect("/admin/listing-requests");
}

async function rejectListing(req, res) {
    const {id} = req.params;
    const reason = req.body.rejectionReason || "Listing did not meet review requirements.";
    const listing = await Listing.findByIdAndUpdate(id, {
        status: "rejected",
        rejectionReason: reason,
        reviewedBy: res.locals.currAdmin._id,
        reviewedAt: new Date(),
    }, {new: true});

    await AuditLog.create({
        admin: res.locals.currAdmin._id,
        listing: id,
        action: "rejected",
        reason,
    });


    req.flash("error", "Listing rejected.");
    res.redirect("/admin/listing-requests");
}

async function adminsIndex(req, res) {
    const admins = await Admin.find().sort({role: -1, username: 1});
    res.render("admin/admins/index.ejs", {admins});
}

function newAdmin(req, res) {
    res.render("admin/admins/new.ejs", {error: null});
}

async function createAdmin(req, res) {
    try {
        const {username, email, password} = req.body.admin;
        const admin = new Admin({
            username,
            email,
            role: "admin",
            createdBy: res.locals.currAdmin._id,
        });

        await Admin.register(admin, password);
        res.redirect("/admin/admins");
    } catch (err) {
        const error = err.name === "UserExistsError" || err.code === 11000 ? "Admin email already exists." : "Could not create admin.";
        res.status(400).render("admin/admins/new.ejs", {error});
    }
}

async function deleteAdmin(req, res) {
    const {id} = req.params;

    if (id === res.locals.currAdmin._id.toString()) {
        return res.redirect("/admin/admins");
    }

    await Admin.findOneAndDelete({_id: id, role: "admin"});
    res.redirect("/admin/admins");
}

async function usersIndex(req, res) {
    const users = await User.find().sort({_id: -1});

    // Count listings per user in one query
    const listingCounts = await Listing.aggregate([
        {$group: {_id: "$UserID", count: {$sum: 1}}},
    ]);
    const listingCountMap = {};
    listingCounts.forEach((item) => {
        if (item._id) listingCountMap[item._id.toString()] = item.count;
    });

    res.render("admin/users/index.ejs", {users, listingCountMap});
}

async function userListings(req, res) {
    const {id} = req.params;
    const user = await User.findById(id);
    if (!user) {
        req.flash("error", "User not found.");
        return res.redirect("/admin/users");
    }
    const listings = await Listing.find({UserID: id}).sort({_id: -1});
    res.render("admin/users/listings.ejs", {user, listings});
}

async function deleteUser(req, res) {
    const {id} = req.params;
    await Listing.deleteMany({UserID: id});
    await User.findByIdAndDelete(id);
    req.flash("success", "User and their listings deleted.");
    res.redirect("/admin/users");
}

module.exports = {
    adminsIndex,
    approveListing,
    createAdmin,
    dashboard,
    deleteAdmin,
    deleteUser,
    listingRequests,
    login,
    loginForm,
    logout,
    newAdmin,
    rejectListing,
    userListings,
    usersIndex,
};
