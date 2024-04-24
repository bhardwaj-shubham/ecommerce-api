import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Seller } from "../models/sellers.model.js";

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

export { signupSeller, loginSeller };
