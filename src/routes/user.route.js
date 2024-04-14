import express from "express";
import {
  signupUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  refreshAccessToken,
  changeUserPassword,
  updateAccountDetails,
  getUserPurchaseHistory,
} from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.route("/signup").post(signupUser);
router.route("/login").post(loginUser);

// should be protected - used middleware
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/current-user").get(verifyJWT, getCurrentUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/change-password").post(verifyJWT, changeUserPassword);
router.route("/update-account").post(verifyJWT, updateAccountDetails);
router.route("/purchase-history").get(verifyJWT, getUserPurchaseHistory);

export default router;
