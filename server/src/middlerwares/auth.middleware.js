import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.js";
import Users from "../models/user.model.js";
import { ApiError } from "../utils/apiError.js";

export const verifyJwt = asyncHandler(async (req, res, next) => {
  const token =
    req.cookies?.accessToken ||
    req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    throw new ApiError(401, "Access token missing");
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  } catch (error) {
    throw new ApiError(401, "Invalid or expired access token");
  }

  const user = await Users.findById(decoded._id).select("-password");

  if (!user) {
    throw new ApiError(401, "User not found");
  }

  req.user = user;
  next();
});
