import APIError from './APIError.js';

function prettyError(error) {
    // If error is an instance of APIError, use its properties
    if (error instanceof APIError) {
        return {
            status: error.statusCode,
            obj: {
                success: error.success,
                message: error.message,
                code: error.code,
                ...(error.additionalData || {})
            }
        };
    }
    
    // Default error response
    let message = "Internal server error";
    let status = 500;
    let code = "SERVER_ERROR";
    
    // In development, include the actual error message
    if (process.env.NODE_ENV === "development") {
        message = error.message || message;
    }
    
    return {
        status,
        obj: {
            success: false,
            message,
            code,
        },
    };
}

export default prettyError;