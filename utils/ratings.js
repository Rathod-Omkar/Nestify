function normalizeRating(value, fallback = 0) {
    const rating = Number(value);

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        return fallback;
    }

    return rating;
}

function parseBoolean(value) {
    return value === true || value === "true" || value === "on" || value === "1";
}

function calculateSustainabilityScore(checklist = {}) {
    const fields = [
        "hasSolar",
        "wasteSegregation",
        "rainwaterHarvesting",
        "energyEfficientAppliances",
        "publicTransportAccess",
        "waterSavingFixtures",
    ];
    const checkedCount = fields.filter((field) => parseBoolean(checklist[field])).length;

    return Math.round((checkedCount / fields.length) * 5 * 10) / 10;
}

module.exports = {
    calculateSustainabilityScore,
    normalizeRating,
    parseBoolean,
};
