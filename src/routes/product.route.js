import express from "express";
import {
  getAllProducts,
  getProductById,
} from "../controllers/product.controller.js";
import { verifyJWT } from "../middlewares/authUser.middleware.js";

const router = express.Router();

router.use(verifyJWT);

router.route("/all-products").get(getAllProducts);
router.route("/product/:id").get(getProductById);
// router.route("/search").get(searchProducts);

export default router;
