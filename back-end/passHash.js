#!/usr/bin/env node
import readline from "readline";
import bcrypt from "bcryptjs";

async function promptHidden(promptText) {
    return new Promise((resolve) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        process.stdin.on("data", (char) => {
            char = char + "";
            if (char === "\n" || char === "\r" || char === "\u0004") {
                // end input
            } else {
                // overwrite output with asterisks
                readline.moveCursor(process.stdout, -1, 0);
                process.stdout.write("*");
            }
        });

        // show prompt and read line (we will not echo characters because we immediately mask above)
        rl.question(promptText, (password) => {
            rl.close();
            process.stdin.removeAllListeners("data");
            process.stdout.write("\n");
            resolve(password);
        });
    });
}

(async () => {
    try {
        const password = await promptHidden("Enter password: ");
        if (!password) {
            console.error("No password entered. Exiting.");
            process.exit(1);
        }

        const saltRounds = 10;
        const salt = await bcrypt.genSalt(saltRounds);
        const hash = await bcrypt.hash(password, salt);

        console.log(hash);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
})();


// $2b$10$3gyFdQEj3IltZg9K1ApiPuAooL4QyN0YHc.rOrMkroLOJfYW9IYW6