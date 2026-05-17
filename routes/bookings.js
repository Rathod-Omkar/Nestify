const express = require("express");
const router = express.Router();
const bookings = require("../controllers/bookings.js");
const {isUserLoggedIn} = require("../middleware/auth.js");
const wrapAsync = require("../utils/asyncWrapper.js");

router.get("/bookings", isUserLoggedIn, wrapAsync(bookings.index));
router.get("/my-bookings", isUserLoggedIn, wrapAsync(bookings.index));
router.get("/profile/history", isUserLoggedIn, wrapAsync(bookings.index));
router.post("/bookings/:id/cancel", isUserLoggedIn, wrapAsync(bookings.cancel));
router.post("/bookings/:id/women-safety-rating", isUserLoggedIn, wrapAsync(bookings.rateWomenSafety));
router.get("/owner/bookings", isUserLoggedIn, wrapAsync(bookings.ownerBookings));
router.get("/owner/calendar", isUserLoggedIn, wrapAsync(bookings.ownerCalendar));
router.post("/owner/bookings/:id/accept", isUserLoggedIn, wrapAsync(bookings.accept));
router.post("/owner/bookings/:id/reject", isUserLoggedIn, wrapAsync(bookings.reject));

module.exports = router;
