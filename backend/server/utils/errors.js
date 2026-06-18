/**
 * Centralized error handling middleware.
 * Prevents leaking stack traces in production and ensures consistent error responses.
 */
export function errorHandler(err, req, res, next) {
    const statusCode = err.status || 500;
    const message = err.message || 'Internal Server Error';

    console.error(`[Error] ${req.method} ${req.url}:`, err);

    res.status(statusCode).json({
        success: false,
        error: {
            message,
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
        }
    });
}

/**
 * Utility to wrap async route handlers and catch errors automatically.
 * Removes the need for try/catch blocks in every controller.
 */
export const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};
