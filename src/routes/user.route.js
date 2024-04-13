import express from "express";
import {
  signupUser,
  loginUser,
  logoutUser,
  getCurrentUser,
} from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = express.Router();

// router.post("/signup", signupUser);
// router.post("/login", loginUser);
// router.post("/logout", logoutUser);
// router.get("/", getCurrentUser);

router.route("/signup").post(signupUser);
router.route("/login").post(loginUser);

// should be protected - used middleware
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/").get(verifyJWT, getCurrentUser);

export default router;
