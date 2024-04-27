import { DataTypes } from "sequelize";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { sequelize } from "./index.js";
import { config } from "../config/config.js";

const Seller = sequelize.define(
  "Seller",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
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
      unique: true,
      allowNull: false,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    address: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    city: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    state: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    zip: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    country: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    refreshToken: {
      type: DataTypes.STRING
    }
  },
  {
    timestamps: true,
    hooks: {
      beforeSave: async function (seller) {
        if (seller.changed("password")) {
          seller.password = await bcrypt.hash(seller.password, 10);
        }
      },
    },
  }
);

// Validate Password
Seller.prototype.validPassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// Generate Access Token
Seller.prototype.generateAccessToken = function () {
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
Seller.prototype.generateRefreshToken = function () {
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

export { Seller };
