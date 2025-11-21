import dotenv from "dotenv";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import loggingService from "./services/logging.js";

async function main() {
    const __dirname = dirname(fileURLToPath(import.meta.url));

    // Read the config file
    dotenv.config({
        path: join(__dirname, "./.env"),
    });

    // Lazy import
    const { connectDB } = await import("./config/sequelize.js");
    // Connect to the database
    connectDB();

    // Get the app
    const app = await import("./app.js");

    app.default.listen(3000, () => {});

    // Handle unhandled promise rejection
    process.on("unhandledRejection", function (err) {
        console.log(err);
        // log it to the logs file
        loggingService.emit("unexpected-rejection", { error: err });
    });

    process.on("uncaughtException", function (err) {
        loggingService.emit("unexpected-rejection", { error: err });
        console.log(err); // this will not crash the app
    });
}

main();
