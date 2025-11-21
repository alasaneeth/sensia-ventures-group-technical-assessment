import { Model, DataTypes } from "sequelize";
import sequelize from "../../../config/sequelize.js";
import { genSalt, hash } from "bcryptjs";

class User extends Model {
    toJSON() {
        const values = { ...this.get() };
        delete values.password;
        return values;
    }
}

// This will be updated in the future
User.init(
    {
        id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true,
        },
        name: {
            type: DataTypes.STRING
        },
        username: {
            type: DataTypes.STRING,
            allowNull: false,
            // unique: true,
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        role: {
            type: DataTypes.INTEGER, // 0 for users and 1 for admin, 2 for printer and 3 for data entry. JUST FOR NOW
            defaultValue: 0,
        },
    },
    {
        hooks: {
            async beforeCreate(user) {
                try {
                    // Custom password validation (run here before hashing)
                    // validatePassword(user.password);
                    const salt = await genSalt(10);
                    user.password = await hash(user.password, salt);

                    user.username = user.username.toLowerCase();
                } catch (err) {
                    throw err;
                }
            },
        },
        sequelize: sequelize,
        tableName: "users",
        timestamps: true,
        createdAt: "createdAt",
        updatedAt: "updatedAt",
    }
);

export default User;
