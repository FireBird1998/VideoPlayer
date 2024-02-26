/**
 * Wraps a request handler function with error handling and async support.
 *
 * @param {Function} requestHandler - The request handler function to wrap.
 * @returns {Function} - The wrapped request handler function.
 */
const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err))
    }
}


export default asyncHandler;
