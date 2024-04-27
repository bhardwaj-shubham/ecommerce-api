import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Seller } from "../models/sellers.model.js";
import jwt from "jsonwebtoken";
import { config } from "../config/config.js";
import { Product } from "../models/products.model.js";

const generateAccessAndRefreshToken = async (sellerId) => {
  try {
    const seller = await Seller.findByPk(sellerId);
    const accessToken = seller.generateAccessToken();
    const refreshToken = seller.generateRefreshToken();

    seller.refreshToken = refreshToken;
    await seller.save({ validate: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Something went wrong while generating tokens.");
  }
};

const signupSeller = asyncHandler(async (req, res) => {
  const { name, email, password, phone, address, city, state, zip, country } =
    req.body;

  if (
    [name, email, password, phone, address, city, state, zip, country].some(
      (field) => !field
    )
  ) {
    throw new ApiError(400, "Please provide all required fields.");
  }

  const existedSeller = await Seller.findOne({
    where: {
      email,
    },
  });

  if (existedSeller) {
    throw new ApiError(409, "Seller with the given email already exists.");
  }

  const seller = await Seller.create({
    name,
    email,
    password,
    phone,
    address,
    city,
    state,
    zip,
    country,
  });

  const createdSeller = await Seller.findByPk(seller.id, {
    attributes: {
      exclude: ["password", "refreshToken"],
    },
  });

  if (!createdSeller) {
    throw new ApiError(500, "Something went wrong while registering seller.");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdSeller, "Seller created successfully"));
});

const loginSeller = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Please provide all required fields.");
  }

  const seller = await Seller.findOne({
    where: {
      email,
    },
    attributes: ["id", "email", "password"],
  });

  if (!seller) {
    throw new ApiError(404, "Seller does not exist.");
  }

  const isPasswordValid = await seller.validPassword(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid email or password");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    seller.id
  );

  const updatedSeller = await Seller.findByPk(seller.id, {
    attributes: {
      exclude: ["password", "refreshToken"],
    },
  });

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          seller: updatedSeller,
          accessToken,
          refreshToken,
        },
        "Seller logged in successfully"
      )
    );
});

const logoutSeller = asyncHandler(async (req, res) => {
  try {
    const updatedSeller = await Seller.update(
      {
        refreshToken: null,
      },
      {
        where: {
          id: req.seller.id,
        },
        returning: true,
      }
    );

    if (updatedSeller[0] === 0) {
      throw new ApiError(500, "Seller not found");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .json(new ApiResponse(200, {}, "Seller logged out successfully"));
  } catch (error) {
    throw new ApiError(500, "Something went wrong while logging out seller.");
  }
});

const getCurrentSeller = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.seller, "Seller retrieved successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Please provide a refresh token.");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      config.get("REFRESH_TOKEN_SECRET")
    );

    const seller = await Seller.findByPk(decodedToken.id);

    if (!seller) {
      throw new ApiError(401, "Invalid refresh token.");
    }

    if (incomingRefreshToken !== seller.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used.");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { newRefreshToken, accessToken } =
      await generateAccessAndRefreshToken(seller.id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            accessToken,
            refreshToken: newRefreshToken,
          },
          "Access token refreshed successfully."
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token.");
  }
});

const changeSellerPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    throw new ApiError(400, "Please provide old and new password.");
  }

  if (oldPassword === newPassword) {
    throw new ApiError(
      400,
      "New password must be different from old password."
    );
  }

  const seller = await Seller.findByPk(req.seller.id);
  const isPasswordValid = await seller.validPassword(oldPassword);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid old password.");
  }

  seller.password = newPassword;
  await seller.save();

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully."));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  // const { name, email, phone, address, city, state, zip, country } = req.body;

  const seller = await Seller.update(
    {
      name: req.body?.name,
      email: req.body?.email,
      phone: req.body?.phone,
      address: req.body?.address,
      city: req.body?.city,
      state: req.body?.state,
      zip: req.body?.zip,
      country: req.body?.country,
    },
    {
      where: {
        id: req.seller.id,
      },
      returning: true,
      attributes: {
        exclude: ["password", "refreshToken"],
      },
    }
  );

  if (seller[0] === 0) {
    throw new ApiError(500, "Seller not found.");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, seller[1][0], "Seller updated successfully."));
});

const getSellerAllProduct = asyncHandler(async (req, res) => {
  const sellerProducts = await Product.findAll({
    where: {
      id: req.seller.id,
    },
  });

  if (!sellerProducts) {
    throw new ApiError(500, "Seller not found.");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        sellerProducts,
        "Seller products history retrieved successfully."
      )
    );
});

export {
  signupSeller,
  loginSeller,
  logoutSeller,
  getCurrentSeller,
  refreshAccessToken,
  changeSellerPassword,
  updateAccountDetails,
  getSellerAllProduct,
};
