import express from "express";
import { verifySellerJWT } from "../middlewares/authSeller.middleware.js";
import { loginSeller, signupSeller } from "../controllers/seller.controller.js";

const router = express.Router();

router.route("/signup").post(signupSeller);
router.route("/login").post(loginSeller);

export default router;