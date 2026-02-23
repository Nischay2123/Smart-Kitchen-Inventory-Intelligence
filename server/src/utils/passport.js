import passport from "passport";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import Users from "../models/user.model.js";

const cookieOrHeaderExtractor = (req) => {
    let token = null;
    if (req?.cookies?.accessToken) {
        token = req.cookies.accessToken;
    } else {
        token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
    }
    return token;
};

const opts = {
    jwtFromRequest: cookieOrHeaderExtractor,
    secretOrKey: process.env.ACCESS_TOKEN_SECRET,
};

passport.use(
    new JwtStrategy(opts, async (jwtPayload, done) => {
        try {
            const user = await Users.findById(jwtPayload._id).select("-password");
            if (!user) return done(null, false);
            return done(null, user);
        } catch (err) {
            return done(err, false);
        }
    })
);

export default passport;
