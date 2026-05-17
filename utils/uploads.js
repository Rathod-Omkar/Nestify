const fs = require("fs");
const path = require("path");
const multer = require("multer");

const uploadPath = path.join(__dirname, "..", "public", "uploads");
fs.mkdirSync(uploadPath, {recursive: true});

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
        cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
    },
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const isListingImage = file.fieldname === "listingImage" || file.fieldname === "listingImages";
        const isProfileImage = file.fieldname === "profileImage" || file.fieldname === "photo";
        const isDocument = ["aadharCard", "electricityBill", "salesDeed", "sustainabilityEvidence"].includes(file.fieldname);
        const isSupportedDocument = file.mimetype.startsWith("image/") || file.mimetype === "application/pdf";

        if (((isListingImage || isProfileImage) && file.mimetype.startsWith("image/")) || (isDocument && isSupportedDocument)) {
            return cb(null, true);
        }

        cb(new Error("Only supported files are allowed."));
    },
});

// Used when creating a new listing (multiple images + documents)
const createListingUpload = upload.fields([
    {name: "listingImages", maxCount: 10},
    {name: "aadharCard", maxCount: 1},
    {name: "electricityBill", maxCount: 1},
    {name: "salesDeed", maxCount: 1},
    {name: "sustainabilityEvidence", maxCount: 5},
]);

// Used when editing a listing (multiple new images, no documents)
const editListingUpload = upload.fields([
    {name: "listingImages", maxCount: 10},
]);

function buildUploadedFile(file) {
    return {
        url: `/uploads/${file.filename}`,
        filename: file.filename,
        originalName: file.originalname,
        mimetype: file.mimetype,
    };
}

module.exports = {
    buildUploadedFile,
    createListingUpload,
    editListingUpload,
    upload,
};
