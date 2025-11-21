import { DataTypes, Model } from "sequelize";
import sequelize from "../../../config/sequelize.js";
class Comment extends Model {}

Comment.init(
    {
        id: {
            type: DataTypes.BIGINT,
            autoIncrement: true,
            primaryKey: true,
        },
        clientId: {
            type: DataTypes.BIGINT,
            allowNull: false,
            references: {
                model: "clients",
                key: "id",
            },
        },
        comment: {
            type: DataTypes.STRING(600),
            allowNull: false,
        },
    },
    {
        sequelize,
        timestamps: true,
        tableName: "comments",
    }
);

export default Comment;
