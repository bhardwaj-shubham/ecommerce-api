import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { config } from "../config/config.js";
import { Product } from "../models/products.model.js";
import { Op } from "sequelize";

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

// test above controller fetch product with id

export { getAllProducts, getProductById };
