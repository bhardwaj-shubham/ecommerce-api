import { DataTypes } from "sequelize";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { sequelize } from "./index.js";
import { config } from "../config/config.js";

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    refreshToken: {
      type: DataTypes.STRING,
    },
  },
  {
    timestamps: true,
    hooks: {
      beforeSave: async function (user) {
        if (user.changed("password")) {
          user.password = await bcrypt.hash(user.password, 10);
        }
      },
    },
  }
);

// Validate Password
User.prototype.validPassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// Generate Access Token
User.prototype.generateAccessToken = function () {
  return jwt.sign(
    {
      id: this.id,
      email: this.email,
      name: this.name,
    },
    config.get("ACCESS_TOKEN_SECRET"),
    {
      expiresIn: config.get("ACCESS_TOKEN_EXPIRY"),
    }
  );
};

// Generate Refresh Token
User.prototype.generateRefreshToken = function () {
  return jwt.sign(
    {
      id: this.id,
    },
    config.get("REFRESH_TOKEN_SECRET"),
    {
      expiresIn: config.get("REFRESH_TOKEN_EXPIRY"),
    }
  );
};

// Define a separate table for purchasedHistory
const PurchasedHistory = sequelize.define("PurchasedHistory", {
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  productId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
});

User.hasMany(PurchasedHistory, { foreignKey: "userId" });
PurchasedHistory.belongsTo(User, { foreignKey: "userId" });

export { User, PurchasedHistory };
