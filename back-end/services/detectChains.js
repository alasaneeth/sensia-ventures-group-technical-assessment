import readline from "readline";

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

let arr = [];
let arr2 = [];

// Ask first question
rl.question("Enter chain one values (space-separated): ", (answer1) => {
    arr = answer1
        .split(" ")
        .map((s) => s.trim())
        .filter(Boolean);

    // Ask second question after the first
    rl.question("Enter chain two values (space-separated): ", (answer2) => {
        arr2 = answer2
            .split(" ")
            .map((s) => s.trim())
            .filter(Boolean);

        // Find items in first not in second
        const notFound = arr.filter((item) => !arr2.includes(item));

        // Find duplicates in each
        const dup1 = arr.filter((item, i, self) => self.indexOf(item) !== i);
        const dup2 = arr2.filter((item, i, self) => self.indexOf(item) !== i);

        console.log("\n=== RESULTS ===");
        console.log("Missing in second list:");
        console.log(notFound.length ? notFound.join("\n") : "None ✅");

        console.log("\nDuplicates in first list:");
        console.log(dup1.length ? dup1.join("\n") : "None ✅");

        console.log("\nDuplicates in second list:");
        console.log(dup2.length ? dup2.join("\n") : "None ✅");

        rl.close();
    });
});
