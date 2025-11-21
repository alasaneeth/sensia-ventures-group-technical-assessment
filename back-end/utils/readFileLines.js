// // reader.js
// import { createReadStream, readSync, openSync, closeSync } from "fs";
// import { createInterface } from "readline";
// import iconv from "iconv-lite";

// /**
//  * Detect file encoding from BOM.
//  * Returns "utf8", "utf16-le", or "utf16-be".
//  * Defaults to "utf8" if no BOM found.
//  */
// function detectUtfBom(filePath) {
//     const fd = openSync(filePath, "r");
//     try {
//         const buf = Buffer.alloc(3);
//         const bytesRead = readSync(fd, buf, 0, 3, 0);
//         if (bytesRead >= 2) {
//             if (buf[0] === 0xff && buf[1] === 0xfe) return "utf16-le";
//             if (buf[0] === 0xfe && buf[1] === 0xff) return "utf16-be";
//         }
//         if (bytesRead === 3) {
//             if (buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf)
//                 return "utf8";
//         }
//         return "utf8"; // safest fallback
//     } finally {
//         closeSync(fd);
//     }
// }

// /**
//  * Async generator to read file line by line in UTF-16 / UTF-8 and yield batches.
//  * @param {string} filePath - Path to the UTF-16 / UTF-8 encoded file.
//  * @param {number} numberOfLines - Lines per batch.
//  */
// export default async function* reader(filePath, numberOfLines = 20) {
//     // Detect the encoding
//     const encoding = detectUtfBom(filePath);

//     // Create the stream with iconv
//     const decoded = createReadStream(filePath).pipe(
//         iconv.decodeStream(encoding)
//     );

//     // Feed decoded text into readline
//     const rl = createInterface({
//         input: decoded,
//         crlfDelay: Infinity,
//     });

//     // Yield patches of lines
//     let lines = [];
//     try {
//         for await (const line of rl) {
//             lines.push(line);
//             if (lines.length >= numberOfLines) {
//                 yield lines;
//                 lines = [];
//             }
//         }
//     } catch (err) {
//         // Handle decoding/stream errors cleanly
//         console.error(`Error while reading file ${filePath}:`, err);
//         throw err;
//     } finally {
//         // Close readline interface to free resources
//         rl.close();
//     }

//     // If there is less than number of lines. it will be yielded here
//     if (lines.length > 0) {
//         yield lines;
//     }
// }

// utils/readFileLines.js
// ESM module

import { createReadStream, readSync, openSync, closeSync } from "fs";
import { createInterface } from "readline";
import iconv from "iconv-lite";

/**
 * Detect file encoding from BOM.
 * Returns "utf8", "utf16-le", or "utf16-be".
 * Defaults to "utf8" if no BOM found.
 */
function detectUtfBom(filePath) {
    const fd = openSync(filePath, "r");
    try {
        const buf = Buffer.alloc(3);
        const bytesRead = readSync(fd, buf, 0, 3, 0);
        if (bytesRead >= 2) {
            if (buf[0] === 0xff && buf[1] === 0xfe) return "utf16-le";
            if (buf[0] === 0xfe && buf[1] === 0xff) return "utf16-be";
        }
        if (bytesRead === 3) {
            if (buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf)
                return "utf8";
        }
        return "utf8";
    } finally {
        closeSync(fd);
    }
}

/**
 *  Excel store the dates as number of days from custom epoc
 * @param {Number} serial
 * @returns
 */
export function excelSerialToISODate(serial) {
    if (!serial) return serial;
    
    // Excel epoch: 1899-12-30 (handles the 1900 leap-year bug)
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const ms = Math.floor(serial) * 86400 * 1000;
    const d = new Date(excelEpoch.getTime() + ms);
    return d.toISOString().slice(0, 10);
}

let printTwice = 2;

/**
 * Nomral helper to normalize the cells on excel files
 * @param {*} v the value in the excel cell
 * @param {*} TypeHint the constructor for the exepected value. or a nomral return value function
 * @returns
 */
function normalizeCellValue(v, TypeHint = null) {
    // Treat null/undefined as null
    if (v == null) return null;

    // exceljs formula / rich objects
    if (typeof v === "object") {
        // If excel cached a result, normalize that
        if (Object.prototype.hasOwnProperty.call(v, "result")) {
            return normalizeCellValue(v.result, TypeHint);
        }

        // if(printTwice) console.log('\n######## value ########\n',v ,'\n################\n');

        // If there is a type hint take it directly
        if (TypeHint !== null) return TypeHint(v);

        // Rich text
        if (Array.isArray(v.richText)) {
            const t = v.richText.map((r) => r?.text ?? "").join("");
            const s = t.trim();
            return s === "" ? null : s;
        }
        // Hyperlink/address-ish
        if (v.text != null) {
            const s = String(v.text).trim();
            return s === "" ? null : s;
        }
        if (v.hyperlink) return String(v.hyperlink);

        // IMPORTANT: a bare formula object with no result => null
        if (Object.prototype.hasOwnProperty.call(v, "formula")) {
            return null;
        }

        // Unknown object → stringified (rare), but coerce empties to null
        const s = String(v).trim();
        return s === "" ? null : s;
    }

    if (TypeHint !== null) return TypeHint(v);

    // Dates
    if (v instanceof Date) {
        return v.toISOString();
    }

    // Primitives
    if (typeof v === "string") {
        const s = v.trim();
        return s === "" ? null : s;
    }
    return v; // numbers/booleans stay as-is
}

/**
 * Unified async generator that can:
 *  - default: stream text lines (iconv-lite) in patches
 *  - excel mode: stream Excel rows from a specific sheet in patches
 *
 * Backward compatibility:
 *  - You can still call reader(filePath, numberOfLines)
 *  - Or call reader(filePath, { engine: 'excel', sheetName: 'marketing', batchSize: 500 })
 *
 * Yields:
 *  - iconv mode: Array<string> (lines)
 *  - excel mode: { headers: string[] | null, rows: Array<Record<string, any>> }
 */
export default async function* reader(filePath, arg2 = 20, arg3 = undefined) {
    // Back-compat arg handling
    const legacyNumber = typeof arg2 === "number" ? arg2 : undefined;
    const opts = typeof arg2 === "object" && arg2 !== null ? arg2 : arg3 || {};
    const {
        engine = "iconv", // default = iconv-lite (text files)
        numberOfLines = legacyNumber ?? 20,
        // excel-only options:
        sheetName = "",
        headerRowIndex = 1, // 1-based
        batchSize = 500,
        typesHint = {},
    } = opts;

    if (engine !== "excel") {
        // --- TEXT / ICONV BRANCH (unchanged behavior) ---
        const encoding = detectUtfBom(filePath);
        const decoded = createReadStream(filePath).pipe(
            iconv.decodeStream(encoding)
        );
        const rl = createInterface({ input: decoded, crlfDelay: Infinity });

        let lines = [];
        try {
            for await (const line of rl) {
                lines.push(line);
                if (lines.length >= numberOfLines) {
                    yield lines;
                    lines = [];
                }
            }
        } catch (err) {
            console.error(`Error while reading file ${filePath}:`, err);
            throw err;
        } finally {
            rl.close();
        }
        if (lines.length > 0) yield lines;
        return;
    }

    // --- EXCEL BRANCH (stream rows from a worksheet without loading into memory) ---
    // Lazy import exceljs only when needed
    const ExcelJS = (await import("exceljs")).default;

    const wanted = String(sheetName).toLowerCase().trim();
    const workbookReader = new ExcelJS.stream.xlsx.WorkbookReader(filePath, {
        // Streaming options tuned for low memory:
        worksheets: "emit",
        sharedStrings: "cache",
        hyperlinks: "emit",
        entries: "emit",
    });

    let emittedAny = false;

    // Iterate worksheets
    for await (const wsReader of workbookReader) {
        const thisName = (wsReader && wsReader.name ? wsReader.name : "")
            .toLowerCase()
            .trim();
        if (thisName !== wanted) {
            // Drain the worksheet to move on
            for await (const _ of wsReader) {
            }
            continue;
        }

        let rowIdx = 0;
        let headers = null;
        let outBatch = [];

        for await (const row of wsReader) {
            rowIdx += 1;
            // Skip rows before headerRowIndex
            if (rowIdx < headerRowIndex) continue;

            const values = row.values || [];
            // exceljs row.values is 1-indexed: values[1] is the first cell
            if (!headers) {
                headers = values.slice(1).map((v) => {
                    const name = normalizeCellValue(v);
                    return name == null || name === "" ? null : String(name);
                });

                // First yield carries headers so the consumer can cache them
                yield { headers, rows: [] };
                emittedAny = true;
                continue;
            }

            // Map this row to a header->value object
            const obj = {};
            for (let i = 1; i < values.length; i++) {
                const key = headers[i - 1] ?? `col_${i}`;
                if (!key) continue; // skip blank header columns

                // Send the expected type hint if there is
                obj[key] = normalizeCellValue(values[i], typesHint[key.trim()]);
            }
            // Keep empty rows out
            if (
                Object.keys(obj).length > 0 &&
                Object.values(obj).some((v) => v !== null && v !== "")
            ) {
                outBatch.push(obj);
            }

            if (outBatch.length >= batchSize) {
                yield { headers: null, rows: outBatch };
                emittedAny = true;
                outBatch = [];
            }
        }

        if (outBatch.length > 0) {
            yield { headers: null, rows: outBatch };
            emittedAny = true;
        }

        // We found the target sheet; stop after processing it
        break;
    }

    if (!emittedAny) {
        throw new Error(
            `Sheet "${sheetName}" not found or empty in file: ${filePath}`
        );
    }
}
