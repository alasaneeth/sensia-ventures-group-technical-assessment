import { Op } from "sequelize";

export const rawMapper = {
    eq: "=",
    ne: "!=",
    gt: ">",
    gte: ">=",
    lt: "<",
    lte: "<=",
    like: "LIKE",
    iLike: "ILIKE",
};

export function rawSearchParser(filters) {
    let filterConditions = [];
    let replacements = {};

    if (filters && Object.keys(filters).length > 0) {
        Object.entries(filters).forEach(([key, value], index) => {
            if (Array.isArray(value)) {
                value.forEach((filter, filterIndex) => {
                    const opKey = Object.keys(filter)[0];
                    const paramName = `${key}_${index}_${filterIndex}`;
                    
                    // Handle 'in' operator specially
                    if (opKey === 'in') {
                        const inValues = filter[opKey];
                        if (Array.isArray(inValues) && inValues.length > 0) {
                            // Create placeholder names for each value
                            const placeholders = inValues.map((_, i) => `:${paramName}_${i}`).join(', ');
                            filterConditions.push(`"${key}" IN (${placeholders})`);
                            // Add each value to replacements
                            inValues.forEach((val, i) => {
                                replacements[`${paramName}_${i}`] = val;
                            });
                        }
                    } else {
                        const sqlOp = rawMapper[opKey] || "=";
                        // Wrap column names in double quotes for camelCase support
                        filterConditions.push(`"${key}" ${sqlOp} :${paramName}`);
                        replacements[paramName] = filter[opKey];
                    }
                });
            } else {
                const paramName = `${key}_${index}`;
                // Wrap column names in double quotes for camelCase support
                filterConditions.push(`"${key}" = :${paramName}`);
                replacements[paramName] = value;
            }
        });
    }

    console.log(
        "\n######  paring raw queries ##########\n",
        filterConditions,
        "\n################\n"
    );

    return { filterConditions, replacements };
}

export function filtersParser(filters, orFields) {
    let filterConditions = {};

    // take the filters that has the shape { field: [{ operation: value }] }
    if (filters && Object.keys(filters).length > 0) {
        Object.entries(filters).forEach(([key, value]) => {
            if (Array.isArray(value)) {
                value.forEach((filter) => {
                    const opKey = Object.keys(filter)[0];
                    const sqlOp = Op[opKey];

                    // Check first if the field included in the or fields
                    if (orFields?.includes(key.trim())) {
                        if (filterConditions[Op.or]) {
                            filterConditions[Op.or].push({
                                [key]: { [sqlOp]: filter[opKey] },
                            });
                        } else {
                            filterConditions[Op.or] = [
                                { [key]: { [sqlOp]: filter[opKey] } },
                            ];
                        }

                        // Terminate here
                        return;
                    }

                    if (filterConditions[Op.and]) {
                        filterConditions[Op.and].push({
                            [key]: { [sqlOp]: filter[opKey] },
                        });
                    } else {
                        filterConditions[Op.and] = [
                            {
                                [key]: {
                                    [sqlOp]: filter[opKey],
                                },
                            },
                        ];
                    }
                });
            } else {
                filterConditions[key] = {
                    [Op[Object.keys(value)[0]]]: value,
                };
            }
        });
    }
    return filterConditions;
}

/**
 * New filter parser that handles 'or' field as a special case
 * Supports filters with an 'or' array containing field-operation-value objects
 *
 * Example input:
 * {
 *   type: [{ ne: "offer" }, { ne: "product" }],
 *   country: [{ eq: "US" }],
 *   or: [
 *     { theme: { eq: 'something' } },
 *     { theme: { eq: null } }
 *   ]
 * }
 */
export function filtersParserV2(filters) {
    let filterConditions = {};

    if (filters && Object.keys(filters).length > 0) {
        Object.entries(filters).forEach(([key, value]) => {
            // Special handling for 'or' field
            if (key === "$or$" && Array.isArray(value)) {
                value.forEach((orCondition) => {
                    // Each orCondition is like { theme: { eq: 'something' } }
                    Object.entries(orCondition).forEach(
                        ([field, operations]) => {
                            Object.entries(operations).forEach(
                                ([opKey, opValue]) => {
                                    const sqlOp = Op[opKey];

                                    if (filterConditions[Op.or]) {
                                        filterConditions[Op.or].push({
                                            [field]: { [sqlOp]: opValue },
                                        });
                                    } else {
                                        filterConditions[Op.or] = [
                                            { [field]: { [sqlOp]: opValue } },
                                        ];
                                    }
                                }
                            );
                        }
                    );
                });
            }
            // Regular field handling (same as before)
            else if (Array.isArray(value)) {
                value.forEach((filter) => {
                    const opKey = Object.keys(filter)[0];
                    const sqlOp = Op[opKey];

                    if (filterConditions[Op.and]) {
                        filterConditions[Op.and].push({
                            [key]: { [sqlOp]: filter[opKey] },
                        });
                    } else {
                        filterConditions[Op.and] = [
                            {
                                [key]: {
                                    [sqlOp]: filter[opKey],
                                },
                            },
                        ];
                    }
                });
            } else {
                filterConditions[key] = {
                    [Op[Object.keys(value)[0]]]: value,
                };
            }
        });
    }
    return filterConditions;
}
