const express = require("express");
const router = express.Router();
const admin = require("../controllers/admin.js");
const {isAdmin, isSuperAdmin, redirectIfAdminLoggedIn} = require("../middleware/auth.js");
const wrapAsync = require("../utils/asyncWrapper.js");

router.get("/login", redirectIfAdminLoggedIn, admin.loginForm);
router.post("/login", redirectIfAdminLoggedIn, admin.login);
router.post("/logout", isAdmin, admin.logout);
router.get("/", isAdmin, wrapAsync(admin.dashboard));
router.get("/listing-requests", isAdmin, wrapAsync(admin.listingRequests));
router.post("/listing-requests/:id/approve", isAdmin, wrapAsync(admin.approveListing));
router.post("/listing-requests/:id/reject", isAdmin, wrapAsync(admin.rejectListing));
router.get("/admins", isAdmin, admin.adminsIndex);
router.get("/admins/new", isAdmin, isSuperAdmin, admin.newAdmin);
router.post("/admins", isAdmin, isSuperAdmin, wrapAsync(admin.createAdmin));
router.delete("/admins/:id", isAdmin, isSuperAdmin, wrapAsync(admin.deleteAdmin));

router.get("/users", isAdmin, wrapAsync(admin.usersIndex));
router.get("/users/:id/listings", isAdmin, wrapAsync(admin.userListings));
router.delete("/users/:id", isAdmin, wrapAsync(admin.deleteUser));

module.exports = router;
