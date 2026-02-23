import passport from "../utils/passport.js";
import { ApiError } from "../utils/apiError.js";

export const verifyJwt = (req, res, next) => {
  passport.authenticate("jwt", { session: false }, (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      const message =
        info?.name === "JsonWebTokenError" || info?.name === "TokenExpiredError"
          ? "Invalid or expired access token"
          : "Access token missing";
      throw new ApiError(401, message);
    }
    req.user = user;
    return next();
  })(req, res, next);
};

