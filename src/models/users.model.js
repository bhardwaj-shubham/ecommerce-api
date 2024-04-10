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
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
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
  }
);

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

User.beforeCreate(async (user) => {
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(user.password, salt);
});

User.beforeSave(async (user) => {
  if (user.changed("password")) {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
  }
});

User.prototype.validPassword = async (password) => {
  return await bcrypt.compare(password, this.password);
};

// Generate Access Token
User.prototype.generateAccessToken = () => {
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
User.prototype.generateRefreshToken = () => {
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

export { User, PurchasedHistory };
