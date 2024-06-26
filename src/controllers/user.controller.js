import { PurchasedHistory, User } from "../models/users.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { config } from "../config/config.js";
import jwt from "jsonwebtoken";
import { Product } from "../models/products.model.js";
import { Order } from "../models/orders.model.js";
import { OrderDetails } from "../models/orderDetails.model.js";
import Stripe from "stripe";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findByPk(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Something went wrong while generating tokens.");
  }
};

const signupUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    throw new ApiError(400, "Please provide all required fields.");
  }

  const existedUser = await User.findOne({
    where: {
      email,
    },
  });

  if (existedUser) {
    throw new ApiError(409, "User with the given email already exists.");
  }

  const user = await User.create({
    name,
    email,
    password,
  });

  const createdUser = await User.findByPk(user.id, {
    attributes: {
      exclude: ["password", "refreshToken"],
    },
  });

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering user.");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User created successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  // console.log(email, password);

  if (!email || !password) {
    throw new ApiError(400, "Please provide email and password.");
  }

  const user = await User.findOne({
    where: {
      email,
    },
    attributes: ["id", "email", "password"],
  });

  if (!user) {
    throw new ApiError(404, "User does not exist.");
  }

  const isPasswordValid = await user.validPassword(password);
  // console.log(isPasswordValid);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid email or password.");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user.id
  );

  const updatedUser = await User.findByPk(user.id, {
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
          user: updatedUser,
          accessToken,
          refreshToken,
        },
        "User logged in successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  try {
    const updatedUser = await User.update(
      {
        refreshToken: null,
      },
      {
        where: {
          id: req.user.id,
        },
        returning: true,
      }
    );

    if (updatedUser[0] === 0) {
      throw new ApiError(500, "User not found.");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .json(new ApiResponse(200, {}, "User logged out successfully"));
  } catch (error) {
    throw new ApiError(500, "Something went wrong while logging out user.");
  }
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "User retrieved successfully"));
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

    const user = await User.findByPk(decodedToken.id);

    if (!user) {
      throw new ApiError(401, "Invalid refresh token.");
    }

    if (incomingRefreshToken !== user.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used.");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { newRefreshToken, accessToken } =
      await generateAccessAndRefreshToken(user.id);

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

const changeUserPassword = asyncHandler(async (req, res) => {
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

  const user = await User.findByPk(req.user.id);
  const isPasswordValid = await user.validPassword(oldPassword);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid old password.");
  }

  user.password = newPassword;
  await user.save();

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully."));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { name, email } = req.body;

  if (!name || !email) {
    throw new ApiError(400, "Please provide name and email.");
  }

  const user = await User.update(
    {
      name,
      email,
    },
    {
      where: {
        id: req.user.id,
      },
      returning: true,
      attributes: {
        exclude: ["password", "refreshToken"],
      },
    }
  );

  if (user[0] === 0) {
    throw new ApiError(500, "User not found.");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, user[1][0], "User updated successfully."));
});

const getUserPurchaseHistory = asyncHandler(async (req, res) => {
  const userWithPurchaseHistory = await User.findOne({
    where: {
      id: req.user.id,
    },
    include: [
      {
        model: PurchasedHistory,
        as: "purchaseHistories",
      },
    ],
    attributes: {
      exclude: ["password", "refreshToken"],
    },
  });

  if (!userWithPurchaseHistory) {
    throw new ApiError(500, "User not found.");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        userWithPurchaseHistory,
        "User purchase history retrieved successfully."
      )
    );
});

const buyProduct = asyncHandler(async (req, res) => {
  const { productId, quantity, payment_method } = req.body;

  if (!productId || !quantity || !payment_method) {
    throw new ApiError(
      400,
      "Please provide product ID, quantity, and payment method."
    );
  }

  const product = await Product.findByPk(productId);

  if (!product) {
    throw new ApiError(404, "Product not found.");
  }

  const totalAmount = product.price * quantity;

  const order = await Order.create({
    userId: req.user.id,
    totalAmount,
    status: "pending",
  });

  let paymentIntent;

  try {
    const stripe = new Stripe(config.get("STRIPE_SECRET_KEY"));

    // Create a PaymentIntent with the order amount and currency
    paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount,
      currency: "inr",
      payment_method,
      confirmation_method: "manual",
      confirm: true,
    });

    if (!paymentIntent) {
      throw new ApiError(500, "Payment failed.");
    }
  } catch (error) {
    console.error("Error creating PaymentIntent:", error.message);
    throw new ApiError(500, "Payment failed.");
  }

  order.status = "processing";
  await order.save();

  const orderDetails = await OrderDetails.create({
    orderId: order.id,
    productId,
    quantity,
    unitPrice: product.price,
    subTotal: totalAmount,
  });

  const purchaseHistory = await PurchasedHistory.create({
    userId: req.user.id,
    orderId: order.id,
    productId,
    quantity,
    totalAmount,
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        order,
        orderDetails,
        purchaseHistory,
        paymentIntent,
      },
      "Product purchased successfully."
    )
  );
});

export {
  signupUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  refreshAccessToken,
  changeUserPassword,
  updateAccountDetails,
  getUserPurchaseHistory,
  buyProduct,
};
