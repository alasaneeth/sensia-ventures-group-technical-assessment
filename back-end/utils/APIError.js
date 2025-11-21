/**
 * @typedef {Array<[string, string]>} AdditionalInfo
 */

// The operation error is error that not related to syntax errors. Like missing values to create article
class APIError extends Error {
    /**
     * Global API error type
     * @param {string} message - Error message
     * @param {number} statusCode - HTTP status code
     * @param {string} code - Error code identifier
     * @param {AdditionalInfo|null} additionalData - Additional data as key-value pairs
     */
    constructor(message, statusCode, code, additionalData = null) {
        super(message);
        this.statusCode = statusCode;
        this.success = false;
        this.code = code;
        this.additionalData = {};

        // This is very useful when you want to send more info using error handler middleware
        if (additionalData !== null) {
            for (let pair of additionalData) {
                this.additionalData[pair[0]] = pair[1];
            }
        }
    }
}

export default APIError;