import mongoose from "mongoose";
import "dotenv/config";

mongoose
  .connect(process.env.MONGODB_URL)
  .then(() => console.log(`Connected......`))
  .catch((err) => console.log(`${err.message}`));
