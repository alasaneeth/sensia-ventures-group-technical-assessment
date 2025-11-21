import EventEmitter from "events";
import { appendFile, mkdir, access, constants } from "fs/promises";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

class LoggingService extends EventEmitter {}

const loggingService = new LoggingService();

const __dirname = dirname(fileURLToPath(import.meta.url));
const logsDir = join(__dirname, "../logs");

/**
 * Ensures a log file exists before writing to it
 * @param {string} filePath - The path to the log file
 * @param {string} content - The content to write
 */
async function ensureLogFileAndWrite(filePath, content) {
    try {
        // Make sure the logs directory exists
        try {
            await access(logsDir, constants.F_OK);
        } catch (err) {
            // Directory doesn't exist, create it
            await mkdir(logsDir, { recursive: true });
        }
        
        // Write to the log file (appendFile will create it if it doesn't exist)
        await appendFile(filePath, content);
    } catch (err) {
        console.error(`Error writing to log file ${filePath}:`, err);
    }
}

// To measure the time that consumed by a route handler
loggingService.addListener(
    "resource-time-usage",
    function ({ resourceName, timeMs }) {
        const logPath = join(logsDir, "resources_usage.log");
        const content = `${new Date()}\n\n${resourceName} handler took about ${timeMs}ms to complete\n----------------\n`;
        ensureLogFileAndWrite(logPath, content);
    }
);

// To measure a time taken by any function
loggingService.addListener(
    "function-time-usage",
    function ({ header, timeMs }) {
        const logPath = join(logsDir, "functions_usage.log");
        const content = `${new Date()}\n${header}: Took ${timeMs}ms to complete\n\n`;
        ensureLogFileAndWrite(logPath, content);
    }
);

// For logging some queries time consuming
loggingService.addListener("query-time-usage", function ({ sql, timeMs }) {
    const logPath = join(logsDir, "sql_usage.log");
    const content = `${new Date()}\n\nSQL:\n${sql}\n\n\n\nTOOK: ${timeMs}ms\n\n---------------\n`;
    ensureLogFileAndWrite(logPath, content);
});

loggingService.addListener("unexpected-rejection", function ({ error }) {
    const logPath = join(logsDir, "unexpected_rejection.log");
    const content = `${new Date()}\n\nError:\n\n${error}\n\n---------------\n\n`;
    ensureLogFileAndWrite(logPath, content);
});

loggingService.addListener("log", function (...logs) {
    const logPath = join(logsDir, "log.log");
    const content = `${new Date()}\n\n${logs.join("\n")}\n\n---------------\n\n`;
    ensureLogFileAndWrite(logPath, content);
});

export default loggingService;
