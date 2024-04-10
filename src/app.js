import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import "dotenv/config";

const app = express();

const PORT = process.env.PORT || 4000;

app.use(
  cors({
    origin: "http://localhost:${PORT}",
    credentials: true,
  })
);
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());

import userRouter from "./routes/user.route.js";

app.use("/api/v1/users", userRouter);

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
