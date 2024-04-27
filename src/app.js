import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { config } from "../src/config/config.js";

const app = express();

const PORT = config.get("PORT") || 4000;

app.use(
  cors({
    origin: config.get("CORS_ORIGIN"),
    credentials: true,
  })
);
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

import userRouter from "./routes/user.route.js";
import productRouter from "./routes/product.route.js";
import sellerRouter from "./routes/seller.route.js";

app.use("/api/v1/users", userRouter);
app.use("/api/v1/products", productRouter);
app.use("/api/v1/sellers", sellerRouter);

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
