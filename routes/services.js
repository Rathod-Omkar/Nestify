const express = require("express");
const router = express.Router();
const services = require("../controllers/services.js");
const {isUserLoggedIn} = require("../middleware/auth.js");
const {upload} = require("../utils/uploads.js");
const wrapAsync = require("../utils/asyncWrapper.js");

router.get("/", isUserLoggedIn, wrapAsync(services.index));
router.get("/new", isUserLoggedIn, services.newForm);
router.post("/", isUserLoggedIn, upload.single("photo"), wrapAsync(services.create));
router.delete("/:id", isUserLoggedIn, wrapAsync(services.destroy));

module.exports = router;
