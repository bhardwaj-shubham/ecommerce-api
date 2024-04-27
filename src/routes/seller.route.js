import express from "express";
import { verifySellerJWT } from "../middlewares/authSeller.middleware.js";
import {
  loginSeller,
  signupSeller,
  logoutSeller,
  getCurrentSeller,
  refreshAccessToken,
  changeSellerPassword,
  updateAccountDetails,
  getSellerAllProduct,
} from "../controllers/seller.controller.js";

const router = express.Router();

router.route("/signup").post(signupSeller);
router.route("/login").post(loginSeller);

// should be protected - used middleware
router.route("/logout").post(verifySellerJWT, logoutSeller);
router.route("/current-seller").get(verifySellerJWT, getCurrentSeller);
router.route("/refresh-token").post(verifySellerJWT, refreshAccessToken);
router.route("/change-password").post(verifySellerJWT, changeSellerPassword);
router.route("/update-account").patch(verifySellerJWT, updateAccountDetails);
router.route("/products").get(verifySellerJWT, getSellerAllProduct);

export default router;
