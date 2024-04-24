import express from "express";
import {
  getAllProducts,
  getProductById,
} from "../controllers/product.controller.js";

const router = express.Router();

router.route("/all-products").get(getAllProducts);
router.route("/:productId").get(getProductById);

export default router;
