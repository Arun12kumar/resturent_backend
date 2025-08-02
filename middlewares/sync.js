/**
 * Wrapper for async middleware that catches errors and forwards them
 * to the Express error handler
 * @param {Function} fn - Async middleware function
 * @returns {Function} - Wrapped middleware function
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;