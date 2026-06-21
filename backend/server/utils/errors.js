/**
 * Custom AppError class to attach specific HTTP status codes securely.
 */
export class AppError extends Error {
    constructor(message, status) {
        super(message);
        this.status = status;
        this.isOperational = true; // Indicates it is a known error, not an unexpected crash
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Centralized error handling middleware.
 * Prevents leaking stack traces in production and ensures consistent error responses.
 */
export function errorHandler(err, req, res, next) {
    const statusCode = err.status || 500;
    const message = err.isOperational ? err.message : 'Internal Server Error';

    if (!err.isOperational) {
        // Log unexpected bugs heavily for auditing
        console.error(`[CRITICAL] ${req.method} ${req.url}:`, err);
    } else {
        // Less noisy logging for known validations
        console.log(`[Validation] ${req.method} ${req.url}: ${message}`);
    }

    res.status(statusCode).json({
        success: false,
        error: {
            message,
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack, fullMsg: err.message })
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
