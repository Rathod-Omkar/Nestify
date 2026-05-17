// utils/asyncWrapper.js
// Wraps an async route handler so any thrown error is passed to express's
// error handler instead of crashing the server.
function wrapAsync(fn) {
    return function (req, res, next) {
        fn(req, res, next).catch(next);
    };
}

module.exports = wrapAsync;
