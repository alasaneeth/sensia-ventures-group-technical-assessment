import { Model, DataTypes } from "sequelize";
import sequelize from "../../../config/sequelize.js";
import Brand from "../../companies/models/brand.js";

class ProductVariation extends Model {}

ProductVariation.init(
    {
        id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true,
        },
        productId: {
            type: DataTypes.BIGINT,
            allowNull: false,
            references: {
                model: "products",
                key: "id",
            },
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
        },
        // Make it unique with the barnds
        code: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        variation: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        // 30 days...
        programTime: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        // 1 cap/day
        posology: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        description: {
            type: DataTypes.STRING(500),
            allowNull: true,
        },
        pricingPerItem: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
        },
        // The currency for pricing
        currency: {
            type: DataTypes.STRING,
        },
        // Pending or approved
        formulaProductVariationFromLaboratory: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: "Laboratory approval status (Pending/Approved)",
        },
        supplementFacts: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: "Supplement facts information",
        },
        instructions: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: "Usage instructions",
        },
        upcCode: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: "Universal Product Code",
        },
        manufacturedDescription: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: "Manufacturing description",
        },
        frontClaims: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: "Front label claims",
        },
        fdaStatements: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: "FDA regulatory statements",
        },
        name: {
            type: DataTypes.STRING,
            allowNull: true,

        },

        brandId: {
            type: DataTypes.BIGINT,
            references: {
                model: Brand,
                key: "id",
            },
        },
    },
    {
        sequelize,
        tableName: "product_variations",
        timestamps: true,
        hooks: {
            beforeCreate(record) {
                // Trim string fields before creating
                if (record.code) record.code = record.code.trim();
                if (record.variation)
                    record.variation = record.variation.trim();
                if (record.programTime)
                    record.programTime = record.programTime.trim();
                if (record.posology) record.posology = record.posology.trim();
                if (record.description)
                    record.description = record.description.trim();
                if (record.upcCode) record.upcCode = record.upcCode.trim();
                if (record.formulaProductVariationFromLaboratory)
                    record.formulaProductVariationFromLaboratory =
                        record.formulaProductVariationFromLaboratory.trim();
            },
            beforeBulkCreate(records) {
                // Trim string fields for bulk create
                records.forEach((record, i) => {
                    if (record.code) records[i].code = record.code.trim();
                    if (record.variation)
                        records[i].variation = record.variation.trim();
                    if (record.programTime)
                        records[i].programTime = record.programTime.trim();
                    if (record.posology)
                        records[i].posology = record.posology.trim();
                    if (record.description)
                        records[i].description = record.description.trim();
                    if (record.upcCode)
                        records[i].upcCode = record.upcCode.trim();
                    if (record.formulaProductVariationFromLaboratory)
                        records[i].formulaProductVariationFromLaboratory =
                            record.formulaProductVariationFromLaboratory.trim();
                });
            },
            beforeUpdate(record) {
                // Trim string fields before updating
                if (record.code) record.code = record.code.trim();
                if (record.variation)
                    record.variation = record.variation.trim();
                if (record.programTime)
                    record.programTime = record.programTime.trim();
                if (record.posology) record.posology = record.posology.trim();
                if (record.description)
                    record.description = record.description.trim();
                if (record.upcCode) record.upcCode = record.upcCode.trim();
                if (record.formulaProductVariationFromLaboratory)
                    record.formulaProductVariationFromLaboratory =
                        record.formulaProductVariationFromLaboratory.trim();
            },
        },
        indexes: [
            {
                type: "UNIQUE",
                fields: ["code", "brandId"],
                name: "product_variations_code_brand",
            },
        ],
    }
);

export default ProductVariation;
