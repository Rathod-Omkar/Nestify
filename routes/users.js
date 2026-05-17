const express = require("express");
const router = express.Router();
const users = require("../controllers/users.js");
const {isUserLoggedIn, redirectIfLoggedIn} = require("../middleware/auth.js");
const {upload} = require("../utils/uploads.js");
const wrapAsync = require("../utils/asyncWrapper.js");

router.get("/signup", redirectIfLoggedIn, users.signupForm);
router.post("/signup", redirectIfLoggedIn, wrapAsync(users.signup));
router.get("/login", redirectIfLoggedIn, users.loginForm);
router.post("/login", redirectIfLoggedIn, users.login);
router.post("/logout", users.logout);
router.get("/profile/pending-listings", isUserLoggedIn, wrapAsync(users.pendingListings));
router.get("/profile/settings", isUserLoggedIn, wrapAsync(users.settingsForm));
router.post("/profile/settings", isUserLoggedIn, upload.single("profileImage"), wrapAsync(users.updateSettings));

module.exports = router;

