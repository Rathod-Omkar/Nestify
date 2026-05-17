const express = require("express");
const router = express.Router();
const listings = require("../controllers/listings.js");
const {isListingOwnerOrAdmin, isLoggedIn, isUserLoggedIn} = require("../middleware/auth.js");
const {createListingUpload, editListingUpload} = require("../utils/uploads.js");
const wrapAsync = require("../utils/asyncWrapper.js");

router.get("/", isLoggedIn, wrapAsync(listings.index));
router.get("/new", isUserLoggedIn, listings.newListing);
router.post("/", isUserLoggedIn, createListingUpload, wrapAsync(listings.create));
router.get("/my-listings", isUserLoggedIn, wrapAsync(listings.myListings));
router.get("/:id", isLoggedIn, wrapAsync(listings.show));
router.post("/:id/bookings", isUserLoggedIn, wrapAsync(listings.createBooking));
router.post("/:id/reviews", isUserLoggedIn, wrapAsync(listings.createReview));
router.get("/:id/edit", isLoggedIn, isListingOwnerOrAdmin, listings.edit);
router.put("/:id", isLoggedIn, isListingOwnerOrAdmin, editListingUpload, wrapAsync(listings.update));
router.delete("/:id", isLoggedIn, isListingOwnerOrAdmin, wrapAsync(listings.destroy));

module.exports = router;
