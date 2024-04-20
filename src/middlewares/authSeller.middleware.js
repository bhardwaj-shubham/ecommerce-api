import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { config } from "../config/config.js";
import { Seller } from "../models/sellers.model.js";

const verifySellerJWT = asyncHandler(async (req, _, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new ApiError(401, "Unauthorized request");
    }

    const decoded = await jwt.verify(token, config.get("ACCESS_TOKEN_SECRET"));

    const seller = await Seller.findByPk(decoded?.id, {
      attributes: {
        exclude: ["password", "refreshToken"],
      },
    });

    if (!seller) {
      throw new ApiError(401, "Invalid Access Token");
    }

    req.seller = seller;
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid Access Token");
  }
});

export { verifySellerJWT };
