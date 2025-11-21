import readline from "readline";

function generateStrongPassword(length = 20) {
    let password = "";
    let allowedSpecial = ["_", "-", "#", "%", "$", "&", "@"];
    for (let i = 0; i < length; i++) {
        const selection = Math.floor(Math.random() * 4);

        // Number
        if (selection === 0) {
            password += Math.floor(Math.random() * 10);
            continue;
        }
        // Upper
        if (selection === 1) {
            password += String.fromCharCode(
                Math.floor(Math.random() * 26) + 65
            );
            continue;
        }
        // Lower
        if (selection === 2) {
            password += String.fromCharCode(
                Math.floor(Math.random() * 26) + 97
            );
            continue;
        }
        // Special
        if (selection === 3) {
            password +=
                allowedSpecial[
                    Math.floor(Math.random() * allowedSpecial.length)
                ];
            continue;
        }
    }
    return password;
}

function main() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    rl.question("Please enter length of the wanted password: ", (length) => {
        console.log(
            "Password generated successfully: \n",
            generateStrongPassword(length)
        );
        rl.question("Want to generate more ? (y/n)", (answer) => {
            if (answer.toLowerCase() === "y") {
                main();
            } else {
                rl.close();
            }
        });
    });
}

main()