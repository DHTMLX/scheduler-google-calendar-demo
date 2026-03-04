import { Router, Request, Response, NextFunction } from "express";
import passport from "../config/passport.js";

const router = Router();

router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email", "https://www.googleapis.com/auth/calendar"],
    accessType: "offline",
    prompt: "consent",
  })
);

router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  (_req: Request, res: Response) => res.redirect("/")
);

router.get("/google/logout", (req: Request, res: Response, next: NextFunction) => {
  req.logout(err => (err ? next(err) : res.redirect("/")));
});

export default router;
