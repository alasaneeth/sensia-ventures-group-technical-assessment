import { Model, DataTypes } from "sequelize";
import sequelize from "../../../config/sequelize.js";
import User from "../../auth/models/user.js";

class DevComment extends Model {}

DevComment.init(
    {
        id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true,
        },
        userId: {
            type: DataTypes.BIGINT,
            allowNull: false,
            references: {
                model: User,
                key: "id",
            },
            allowNull: true,
        },
        type: {
            type: DataTypes.ENUM("bug", "feature"),
            allowNull: false,
            defaultValue: "bug",
        },
        comment: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
    },
    {
        sequelize,
        modelName: "Comment",
        tableName: "dev_comments",
        timestamps: true,
    }
);

export default DevComment;
