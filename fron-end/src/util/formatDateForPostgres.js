/**
 * Convert dayjs date object to PostgreSQL acceptable format (MM-DD-YYYY)
 * @param {Object} dayjsDate - dayjs date object
 * @returns {string|null} - Formatted date string (MM-DD-YYYY) or null if invalid
 */
export default function formatDateForPostgres (dayjsDate) {
    if (!dayjsDate || dayjsDate.$y === undefined) {
        return null;
    }
    return `${dayjsDate.$M + 1}-${dayjsDate.$D}-${dayjsDate.$y}`;
};