import Sequelize from "sequelize";
import addAssociations1 from "./addAssociations1.js";
import { getCountryCode } from "../utils/countriesMap.js";
// import createCountryCodesTable from "../migrations/create-country-codes-table.js";
import importAllModels from "./importAllModels.js";
import addAssociations2 from "./addAssociations2.js";
const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASS,
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: "postgres",
        logging: false,
    }
);

export async function connectDB() {
    try {
        // Note that the date in postgres is always has a format of YYYY-MM-DD
        await sequelize.authenticate();

        // Just import all models here before continue to not face any problem of migration later
        await importAllModels();

        // Add the relations (part one)
        await addAssociations1();

        // Add the relations (part two)
        await addAssociations2();

        // Create and populate country codes table
        // await createCountryCodesTable();

        // await addTriggers();

        // MAKE SURE TO RUN THIS LINE ONLY ON DEVELOPMENT ENVIRONMENT
        if (process.env.NODE_ENV === "development") {
            // Sync the current models with tables in database (if something not found in model add it to database not the opposite)
            await sequelize.sync({ alter: true });
        }

        console.log("connected to database successfully");
    } catch (err) {
        console.log(err);
    }
}

async function addTriggers() {
    const t = await sequelize.transaction();
    try {
        // 1) Create or replace the function that sets a 7-char Base62 code
        await sequelize.query(
            `
        CREATE OR REPLACE FUNCTION set_client_offer_code()
        RETURNS trigger AS $$
        DECLARE
            generated_code TEXT;
            code_exists    BOOLEAN;
            attempt_count  INTEGER := 0;
            max_attempts   INTEGER := 10; -- tweak if needed
            chars          TEXT := '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            i              INTEGER;
        BEGIN
            -- If a code is already provided, keep it
            IF NEW.code IS NOT NULL AND LENGTH(NEW.code) > 0 THEN
                RETURN NEW;
            END IF;

            LOOP
                attempt_count := attempt_count + 1;

                -- Build a 7-character Base62 string
                generated_code := '';
                FOR i IN 1..7 LOOP
                    generated_code := generated_code ||
                        SUBSTRING(chars FROM 1 + FLOOR(RANDOM() * 36)::INT FOR 1);
                END LOOP;

                -- Check for collision
                SELECT EXISTS(SELECT 1 FROM client_offers WHERE code = generated_code)
                    INTO code_exists;

                -- If no collision, assign and exit
                IF NOT code_exists THEN
                    NEW.code := generated_code;
                    RETURN NEW;
                END IF;

                -- If we've exceeded attempts, throw an error
                IF attempt_count >= max_attempts THEN
                    RAISE EXCEPTION
                        'Failed to generate a unique 7-char ID after % attempts',
                        max_attempts
                        USING ERRCODE = '23505'; -- unique_violation
                END IF;
            END LOOP;
        END;
        $$ LANGUAGE plpgsql;
        `,
            { transaction: t }
        );

        // 2) Drop existing trigger if any (idempotent)
        await sequelize.query(
            `DROP TRIGGER IF EXISTS trg_set_client_offer_code ON client_offers;`,
            { transaction: t }
        );

        // 3) Create trigger:
        //    - BEFORE INSERT: generate code if not provided
        //    (No need to run on UPDATE unless you want to regenerate on some field change)
        await sequelize.query(
            `
        CREATE TRIGGER trg_set_client_offer_code
        BEFORE INSERT
        ON client_offers
        FOR EACH ROW
        EXECUTE FUNCTION set_client_offer_code();
        `,
            { transaction: t }
        );

        await t.commit();
        console.log("Trigger set up successfully.");
    } catch (err) {
        await t.rollback();
        console.error("Failed to set triggers:", err);
        throw err;
    }
}

export default sequelize;
