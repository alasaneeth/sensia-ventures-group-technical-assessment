import { connectDB } from "../config/sequelize.js";
import sequelize from "../config/sequelize.js";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigration() {
    try {
        await connectDB();
        console.log("Database connected successfully");

        // Read and execute the migration
        const migrationPath = join(
            __dirname,
            "../migrations/20251029135208-create-companies-table.cjs"
        );

        // We'll run the migration SQL directly
        const queryInterface = sequelize.getQueryInterface();
        const { Sequelize } = await import("sequelize");

        // Run the up migration
        await queryInterface.createTable("companies", {
            id: {
                type: Sequelize.BIGINT,
                primaryKey: true,
                autoIncrement: true,
            },
            name: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            description: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            createdAt: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.NOW,
            },
            updatedAt: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.NOW,
            },
        });

        console.log("Companies table created successfully!");
        process.exit(0);
    } catch (error) {
        if (error.message.includes("already exists")) {
            console.log("Companies table already exists. Migration skipped.");
        } else {
            console.error("Migration failed:", error);
        }
        process.exit(1);
    }
}

runMigration();

