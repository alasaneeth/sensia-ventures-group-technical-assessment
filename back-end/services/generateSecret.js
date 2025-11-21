// generateSecret.js
import { createHash, randomBytes } from "crypto";

/**
 * Generate a cryptographically secure secret using SHA-512.
 * @returns {string} Hex-encoded secret
 */
export function generateSHA512Secret() {
    // 64 random bytes = 512 bits
    const randomBuffer = randomBytes(64);

    // Hash with SHA-512 to get a uniform 128-character hex string
    const hashed = createHash("sha512").update(randomBuffer).digest("hex");

    return hashed;
}

// Example usage (only if running this file directly, not when imported as a module)
if (import.meta.url === `file://${process.argv[1]}`) {
    console.log("Generated SHA-512 Secret:");
    console.log(generateSHA512Secret());
}
