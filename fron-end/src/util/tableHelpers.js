export function toLocalMidnight(value) {
    if (!value) return null;

    if (value instanceof Date) {
        return new Date(value.getFullYear(), value.getMonth(), value.getDate());
    }

    if (typeof value === "string") {
        const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
        if (m) return new Date(+m[1], +m[2] - 1, +m[3]);

        const d = new Date(value);
        if (!isNaN(d))
            return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    }

    return null;
}

export function dateComparator(filterLocalDateAtMidnight, cellValue) {
    console.log(
        "\n###### filter value #########\n",
        filterLocalDateAtMidnight,
        "\n\n tpye of filter value \n\n",
        typeof filterLocalDateAtMidnight,
        '\n\n\n\n\n\n  time value \n\n\n\n',
        filterLocalDateAtMidnight.getTime(),
        "\n\n\n\n\n cell value \n\n\n\n\n",
        cellValue,
        "\n\n\n\n\n\n type of cell valiue ",
        cellValue instanceof Date,
        '\n\n\n\n\n time for cell value \n\n\n\n\n\n',
        cellValue.getTime(),
        "\n\n\n\ result \n\n\n\n",
        cellValue < filterLocalDateAtMidnight ? -1 : cellValue >= filterLocalDateAtMidnight ? 1 : 0,
        "\n################\n"
    );

    // const cellDate = toLocalMidnight(cellValue);
    // if (!cellValue) return -1;
    // if (cellValue < filterLocalDateAtMidnight) return -1;
    // if (cellValue > filterLocalDateAtMidnight) return 1;
    return 0;
}

// Map AG Grid filter model -> your API filters format
export function mapAgToApiFilters(agModel) {
    const out = {};
    for (const [colId, m] of Object.entries(agModel || {})) {
        if (!m) continue;
        const list = [];
        if (m.operator) {
            [m.condition1, m.condition2]
                .filter(Boolean)
                .forEach((p) => pushOne(p, list));
        } else {
            pushOne(m, list);
        }
        if (list.length) out[colId] = list;
    }
    return out;

    function pushOne(model, list) {
        const { filterType, type } = model || {};

        console.log(
            "\n###########this one maybe #####\n",
            model,
            "\n################\n"
        );
        // Handle boolean values (like isExtracted)
        if (filterType === "text" && (type === "false" || type === "true")) {
            if (type === "true") list.push({ eq: true });
            if (type === "false") list.push({ eq: false });
            return;
        }

        // Handle set filter (used for boolean fields with agSetColumnFilter)
        if (filterType === "set") {
            if (model.values && model.values.length > 0) {
                // If only one value is selected, use eq
                if (model.values.length === 1) {
                    const value = model.values[0];
                    // Convert string 'true'/'false' to boolean if needed
                    const boolValue =
                        value === "true"
                            ? true
                            : value === "false"
                            ? false
                            : value;
                    list.push({ eq: boolValue });
                } else {
                    // If multiple values, use in operator
                    const values = model.values.map((v) =>
                        v === "true" ? true : v === "false" ? false : v
                    );
                    list.push({ in: values });
                }
            }
            return;
        }

        if (filterType === "text") {
            const val = model.filter;
            if (val == null || val === "") return;
            switch (type) {
                case "equals":
                    list.push({ eq: val });
                    break;
                case "notEqual":
                    list.push({ ne: val });
                    break;
                case "contains":
                    list.push({ iLike: `%${val}%` });
                    break;
                case "startsWith":
                    list.push({ iLike: `${val}%` });
                    break;
                case "endsWith":
                    list.push({ iLike: `%${val}` });
                    break;
                default:
                    list.push({ iLike: `%${val}%` });
            }
        }

        if (filterType === "number") {
            const val = model.filter;
            const valTo = model.filterTo;
            switch (type) {
                case "equals":
                    list.push({ eq: val });
                    break;
                case "notEqual":
                    list.push({ ne: val });
                    break;
                case "lessThan":
                    list.push({ lt: val });
                    break;
                case "lessThanOrEqual":
                    list.push({ lte: val });
                    break;
                case "greaterThan":
                    list.push({ gt: val });
                    break;
                case "greaterThanOrEqual":
                    list.push({ gte: val });
                    break;
                case "inRange":
                    if (val != null) list.push({ gte: val });
                    if (valTo != null) list.push({ lte: valTo });
                    break;
                default:
                    break;
            }
        }

        if (filterType === "date") {
            const from = model.dateFrom;
            const to = model.dateTo;
            switch (type) {
                case "equals":
                    list.push({ eq: from });
                    break;
                case "notEqual":
                    list.push({ ne: from });
                    break;
                case "lessThan":
                    list.push({ lt: from });
                    break;
                case "greaterThan":
                    list.push({ gt: from });
                    break;
                case "inRange":
                    // Ensure consistent order for date range filters
                    // First add the 'from' date (gte) and then the 'to' date (lte)
                    if (from) list.push({ gte: from });
                    if (to) list.push({ lte: to });
                    break;
                default:
                    break;
            }
        }
    }
}

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
