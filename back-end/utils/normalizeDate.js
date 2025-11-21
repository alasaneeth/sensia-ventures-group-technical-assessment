export function normalizeDate(date) {
    if (date instanceof Date) {
        // Return a Date at local midnight, no UTC conversion
        return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    }

    if (typeof date === "string") {
        const [year, month, day] = date.split("-").map(Number);
        return new Date(year, month - 1, day); // local midnight too
    }

    return null;
}
