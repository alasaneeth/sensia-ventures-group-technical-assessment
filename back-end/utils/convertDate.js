/**
 * Parse a YYYYMMDD string/number into ISO date string (YYYY-MM-DD).
 * Returns null if invalid.
 */
export default function convertDate(input) {
    if (!input) return null;

    const str = String(input).trim();
    if (!/^\d{8}$/.test(str)) return null; // must be 8 digits

    const year = str.slice(0, 4);
    const month = str.slice(4, 6);
    const day = str.slice(6, 8);

    // Basic sanity checks
    const y = Number(year);
    const m = Number(month);
    const d = Number(day);

    if (m < 1 || m > 12) return null;
    if (d < 1 || d > 31) return null;

    return `${year}-${month}-${day}`;
}
