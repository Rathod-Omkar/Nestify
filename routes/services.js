const express = require("express");
const router = express.Router();
const services = require("../controllers/services.js");
const {isUserLoggedIn} = require("../middleware/auth.js");
const {upload} = require("../utils/uploads.js");
const wrapAsync = require("../utils/asyncWrapper.js");

router.get("/", isUserLoggedIn, wrapAsync(services.index));
router.get("/new", isUserLoggedIn, services.newForm);
router.get("/:id/edit", isUserLoggedIn, wrapAsync(services.editForm));
router.post("/", isUserLoggedIn, upload.single("photo"), wrapAsync(services.create));
router.put("/:id", isUserLoggedIn, upload.single("photo"), wrapAsync(services.update));
router.delete("/:id", isUserLoggedIn, wrapAsync(services.destroy));

module.exports = router;
