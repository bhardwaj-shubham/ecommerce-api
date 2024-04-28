import express from "express";
import {
  getAllProducts,
  getProductById,
  addProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/product.controller.js";
import { verifySellerJWT } from "../middlewares/authSeller.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = express.Router();

router.route("/all-products").get(getAllProducts);
router.route("/:productId").get(getProductById);

// should be protected - used middleware
router.route("/add-product").post(
  verifySellerJWT,
  upload.fields([
    {
      name: "productImage",
      maxCount: 1,
    },
  ]),
  addProduct
);

router
  .route("/:productId")
  .put(
    verifySellerJWT,
    upload.fields([
      {
        name: "productImage",
        maxCount: 1,
      },
    ]),
    updateProduct
  )
  .delete(verifySellerJWT, deleteProduct);

export default router;
