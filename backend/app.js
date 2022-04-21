import express from "express";
import "dotenv/config";
import "./config/conn.js";
import userRoutes from "./routes/User.js";
import cookieParser from "cookie-parser";
import postRoutes from "./routes/Post.js";

const app = express();
const PORT = process.env.PORT;

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cookieParser());

app.use("/api/v1", postRoutes);
app.use("/api/v1", userRoutes);

app.listen(PORT, () => {
  console.log(`Server on the running PORT http://localhost:${PORT}`);
});
