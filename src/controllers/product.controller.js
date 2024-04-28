import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Product } from "../models/products.model.js";
import { Op } from "sequelize";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { Category } from "../models/categories.model.js";

const getAllProducts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType } = req.query;

  try {
    const options = {
      offset: (page - 1) * limit,
      limit: parseInt(limit),
      order: [],
    };

    let where = {};

    if (query) {
      where.name = {
        [Op.like]: `%${query}%`,
      };
    }

    options.where = where;

    if (sortBy) {
      options.order.push([sortBy, sortType === "desc" ? "DESC" : "ASC"]);
    }

    const products = await Product.findAll(options);

    if (products.length === 0) {
      throw new ApiError(404, "Could not found any products");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, products, "Products fetched successfully."));
  } catch (error) {
    throw new ApiError(500, error?.message || "Products not found.");
  }
});

const getProductById = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  if (!productId) {
    throw new ApiError(404, "Please provide product id.");
  }

  const product = await Product.findByPk(productId);

  if (!product) {
    throw new ApiError(404, `Could not find any product with id ${productId}`);
  }

  return res
    .status(200)
    .json(new ApiResponse(200, product, "Product fetched successfully."));
});

const addProduct = asyncHandler(async (req, res) => {
  const { name, description, price, quantity, categoryName } = req.body;

  if (
    [name, description, price, quantity, categoryName].some((field) => !field)
  ) {
    throw new ApiError(401, "Please provide all required all fields.");
  }

  const doesProductExist = await Product.findOne({
    where: {
      name,
    },
  });

  if (doesProductExist) {
    throw new ApiError(409, "Product with name already exists.");
  }

  let productImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.productImage) &&
    req.files.productImage.length > 0
  ) {
    productImageLocalPath = req.files.productImage[0].path;
  }

  if (!productImageLocalPath) {
    throw new ApiError(400, "Product image file is required.");
  }

  const uploadedProductImage = await uploadOnCloudinary(productImageLocalPath);

  const category = await Category.findOne({
    where: {
      name: categoryName,
    },
  });

  if (!category) {
    throw new ApiError(401, "Please provide correct category name.");
  }

  const product = await Product.create({
    name,
    description,
    price,
    quantity,
    image: uploadedProductImage?.url || "",
    categoryId: category.id,
    seller: req.seller.id,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, product, "Product added successfully."));
});

const updateProduct = asyncHandler(async (req, res) => {
  try {
    const { productId } = req.params;
    const { name, description, price, quantity } = req.body;

    if (!productId) {
      throw new ApiError(404, "Please provide product id.");
    }

    if ([name, description, price, quantity].some((field) => !field)) {
      throw new ApiError(401, "Please provide all required all fields.");
    }

    const product = await Product.findByPk(productId);

    if (!product) {
      throw new ApiError(
        404,
        `Could not find any product with id ${productId}`
      );
    }

    const productImageLocalPath = req.files.productImage[0].path;

    const uploadedProductImage = await uploadOnCloudinary(
      productImageLocalPath
    );

    product.name = name;
    product.description = description;
    product.price = price;
    product.quantity = quantity;
    product.image = uploadedProductImage?.url || "";

    await product.save();

    return res
      .status(200)
      .json(new ApiResponse(200, product, "Product updated successfully."));
  } catch (error) {
    return res
      .status(500)
      .json(
        new ApiError(500, error?.message || "Could not update the product.")
      );
  }
});

const deleteProduct = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  if (!productId) {
    throw new ApiError(404, "Please provide product id.");
  }

  const product = await Product.findByPk(productId);

  if (!product) {
    throw new ApiError(404, `Could not find any product with id ${productId}`);
  }

  await product.destroy();

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Product deleted successfully."));
});

export { getAllProducts, getProductById, addProduct, updateProduct, deleteProduct };
