import { User } from "../models/users.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

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
  console.log(req.body);

  // if ([name, email, password].some((field) => field?.trim() === "")) {
  //   throw new ApiError(400, "Please provide all required fields.");
  // }

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
    password: false,
    refreshToken: false,
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

  if (!email || !password) {
    throw new ApiError(400, "Please provide email and password.");
  }

  const user = await User.findOne({
    where: {
      email,
    },
  });

  if (!user) {
    throw new ApiError(404, "User does not exist.");
  }

  const isPasswordValid = await user.validPassword(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid email or password.");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user.id
  );

  const updatedUser = await User.findByPk(user.id, {
    password: false,
    refreshToken: false,
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
  await User.update(
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

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "User retrieved successfully"));
});

export { signupUser, loginUser, logoutUser };
