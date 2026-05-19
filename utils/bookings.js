const Booking = require("../models/booking.js");

function parseBookingDate(value) {
    if (!value || typeof value !== "string") return new Date(NaN);
    const parts = value.split("-");
    if (parts.length !== 3) return new Date(NaN);
    const [year, month, day] = parts.map(Number);
    return new Date(year, month - 1, day, 0, 0, 0, 0);
}

function getNightCount(checkIn, checkOut) {
    return Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
}

async function hasBookingConflict(listingId, checkIn, checkOut, excludedBookingId) {
    const query = {
        listing: listingId,
        status: {$in: ["pending", "accepted"]},
        checkIn: {$lt: checkOut},
        checkOut: {$gt: checkIn},
    };

    if (excludedBookingId) {
        query._id = {$ne: excludedBookingId};
    }

    return Boolean(await Booking.exists(query));
}

async function getConflictingBookings(listingId, checkIn, checkOut) {
    return Booking.find({
        listing: listingId,
        status: {$in: ["pending", "accepted"]},
        checkIn: {$lt: checkOut},
        checkOut: {$gt: checkIn},
    });
}

function formatDateForInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function getUnavailableDates(bookings) {
    const unavailableDates = [];

    for (const booking of bookings) {
        const currentDate = new Date(booking.checkIn);
        currentDate.setHours(0, 0, 0, 0);
        const checkOut = new Date(booking.checkOut);
        checkOut.setHours(0, 0, 0, 0);

        while (currentDate < checkOut) {
            unavailableDates.push(formatDateForInput(currentDate));
            currentDate.setDate(currentDate.getDate() + 1);
        }
    }

    return unavailableDates;
}

function stayHasCompleted(booking, now = new Date()) {
    return booking && booking.checkOut && new Date(booking.checkOut) <= now;
}

module.exports = {
    formatDateForInput,
    getConflictingBookings,
    getNightCount,
    getUnavailableDates,
    hasBookingConflict,
    parseBookingDate,
    stayHasCompleted,
};
