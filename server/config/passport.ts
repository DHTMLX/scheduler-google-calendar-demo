import passport from "passport";
import { Strategy as GoogleStrategy, Profile } from "passport-google-oauth20";
import type { AuthUser } from "../types/auth.types.ts";
import config from "./index.ts";

passport.serializeUser((user: Express.User, done) => {
  done(null, user);
});

passport.deserializeUser((obj: Express.User, done) => {
  done(null, obj);
});

passport.use(
  new GoogleStrategy(
    {
      clientID: config.GOOGLE_CLIENT_ID || "",
      clientSecret: config.GOOGLE_CLIENT_SECRET || "",
      callbackURL: config.GOOGLE_REDIRECT_URI || "",
    },
    (
      accessToken: string,
      refreshToken: string,
      profile: Profile,
      done: (error: unknown, user?: Express.User) => void
    ) => {
      const user: AuthUser = {
        id: profile.id,
        displayName: profile.displayName,
        tokens: { accessToken, refreshToken },
      };
      done(null, user as unknown as Express.User);
    }
  )
);

export default passport;
