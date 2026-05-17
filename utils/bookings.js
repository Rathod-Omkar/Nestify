const Booking = require("../models/booking.js");

function parseBookingDate(value) {
    const date = new Date(value);
    date.setHours(0, 0, 0, 0);
    return date;
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
    return date.toISOString().split("T")[0];
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
