import User from "../models/User.js";
import statusCode from "../constants/HttpStatusCode.js";
import { sendEmail } from "../middlewares/sendEmail.js";
import crypto from "crypto";
import { stat } from "fs";

export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    let user = await User.findOne({ email });
    if (user)
      return res.status(statusCode.BAD_REQUEST).json({
        success: false,
        message: "User already exist",
      });
    user = await User.create({
      name,
      email,
      password,
      avtar: {
        public_id: "req.body.public_id",
        url: "req.body.url",
      },
    });

    const token = user.generateToken(user._id);

    res.status(statusCode.OK).json({
      success: true,
      user,
      token,
    });
  } catch (err) {
    res.status(statusCode.INTERNAL_SERVER).json({
      success: false,
      message: err.message,
    });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(statusCode.NOT_FOUND).json({
        success: false,
        message: "User does not exist",
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(statusCode.BAD_REQUEST).json({
        success: false,
        message: "Incorrect Password",
      });
    }

    const token = await user.generateToken(user._id);

    const options = {
      httpOnly: true,
    };

    res.status(statusCode.OK).json({
      success: true,
      user,
      token,
    });
  } catch (err) {
    res.status(statusCode.INTERNAL_SERVER).json({
      success: false,
      message: err.message,
    });
  }
};

export const followUser = async (req, res) => {
  try {
    const userToFollow = await User.findById(req.params.id);
    const loggedInUser = await User.findById(req.user._id);

    if (!userToFollow) {
      return res.status(statusCode.NOT_FOUND).json({
        success: false,
        message: "User not found",
      });
    }

    if (loggedInUser.following.includes(userToFollow._id)) {
      const indexFollowing = loggedInUser.following.indexOf(userToFollow._id);
      loggedInUser.following.splice(indexFollowing, 1);

      const indexFollowers = userToFollow.followers.indexOf(loggedInUser._id);
      userToFollow.followers.splice(indexFollowers, 1);
      await loggedInUser.save();
      await userToFollow.save();
      res.status(statusCode.OK).json({
        success: true,
        message: "User Unfollowed",
      });
    } else {
      loggedInUser.following.push(userToFollow._id);
      userToFollow.followers.push(loggedInUser._id);
      await loggedInUser.save();
      await userToFollow.save();
      res.status(statusCode.OK).json({
        success: true,
        message: "User Followed",
      });
    }
  } catch (err) {}
};

export const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("+password");
    if (!user) {
      return res.status(statusCode.NOT_FOUND).json({
        success: false,
        message: "User Not Found",
      });
    }
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    if (req.body.password) {
      const isMatch = await user.matchPassword(req.body.password);
      if (isMatch) {
        return res.status(statusCode.BAD_REQUEST).json({
          success: false,
          message: "Please enter a password again",
        });
      }
      user.password = req.body.password;
    }
    const updateUser = await user.save();
    res.status(statusCode.OK).json({
      success: true,
      message: "Profile Updated",
    });
  } catch (err) {
    res.status(statusCode.INTERNAL_SERVER).json({
      success: false,
      message: err.message,
    });
  }
};

export const myProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate("posts");
    res.status(statusCode.OK).json({
      success: true,
      user,
    });
  } catch (err) {
    res.status(statusCode.INTERNAL_SERVER).json({
      success: false,
      message: err.message,
    });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({});
    res.status(statusCode.OK).json({
      success: true,
      users,
    });
  } catch (err) {
    res.status(statusCode.INTERNAL_SERVER).json({
      success: false,
      message: err.message,
    });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(statusCode.NOT_FOUND).json({
        success: false,
        message: "User not found",
      });
    }

    const resetPasswordToken = user.getResetPasswordToken();

    await user.save();

    const resetUrl = `${req.protocol}://${req.get(
      "host"
    )}/api/v1/password/reset/${resetPasswordToken}`;

    const message = `Reset your password by clicking on the link below: \n\n ${resetUrl}`;

    try {
      await sendEmail({
        email: user.email,
        subject: "Reset Password",
        message,
      });

      res.status(statusCode.OK).json({
        success: true,
        message: `Email sent to ${user.email}`,
      });
    } catch (error) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();
      res.status(statusCode.INTERNAL_SERVER).json({
        success: false,
        message: err.message,
      });
    }
  } catch (error) {
    res.status(statusCode.INTERNAL_SERVER).json({
      success: false,
      message: err.message,
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const resetPassowrdToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    const user = await User.findOne({
      resetPassowrdToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(statusCode.BAD_REQUEST).json({
        success: false,
        message: " This is invalid or has expired",
      });
    }

    user.password = req.body.password;
    user.resetPassowrdToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();
    res.status(statusCode.OK).json({
      success: true,
      message: "Password Successfully Updated!",
    });
  } catch (err) {
    res.status(statusCode.INTERNAL_SERVER).json({
      success: false,
      message: err.message,
    });
  }
};
