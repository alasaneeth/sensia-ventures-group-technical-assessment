import { isValid, parse } from "date-fns";

export function parseISODateSafe(dateField, format = "dd/MM/yy") {
    let isoDate = null;

    if (dateField) {
        const parsedDate = parse(dateField, format, new Date());
        if (isValid(parsedDate)) {
            isoDate = parsedDate.toISOString().slice(0, 10); // YYYY-MM-DD
        }
    }

    return isoDate;
}
