import { Model, DataTypes } from "sequelize";
import sequelize from "../../../config/sequelize.js";
import Brand from "../../companies/models/brand.js";

class PayeeName extends Model {}

PayeeName.init(
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            // unique: true,
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
        hooks: {
            beforeBulkCreate(rows) {
                rows.forEach((row, index) => {
                    if(row.name)
                    rows[index].name = row?.name?.trim();
                })
            },
            beforeCreate(payeeName) {
                if(payeeName.name) {
                    payeeName.name = payeeName.name.trim();
                }
            }
        },
        sequelize,
        timestamps: false,
        tableName: "payee_names",
        indexes: [
            {
                unique: true,
                fields: ["name", "brandId"],
            },
        ],
    }
);

export default PayeeName;