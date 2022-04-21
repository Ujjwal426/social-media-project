import jwt from "jsonwebtoken";
import statusCode from "../constants/HttpStatusCode.js";
import "dotenv/config";
import User from "../models/User.js";

export const isAuthenticated = async (req, res, next) => {
  try {
    let decode = null;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      const token = req.headers.authorization.split(" ")[1];
      decode = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decode._id);
      next();
    }
    if (!decode) {
      return res.status(statusCode.UNAUTHORIZED).json({
        success: false,
        message: "UNAUTHORIZED",
      });
    }
  } catch (err) {
    res.status(statusCode.INTERNAL_SERVER).json({
      success: false,
      message: err.message,
    });
  }
};
