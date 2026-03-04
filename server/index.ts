import path from "path";
import express from "express";
import session from "express-session";

import passport from "./config/passport.ts";
import config from "./config/index.ts";
import authRoute from "./routes/auth.route.ts";
import eventsRoute from "./routes/events.route.ts";

const app = express();

const projectRoot = process.cwd();

app.use(express.json());

app.use(
  session({
    secret: config.SESSION_SECRET || "fallback-secret-for-dev",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: "lax",
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

// EJS view engine setup
app.set("views", path.join(projectRoot, "client"));
app.set("view engine", "ejs");
app.use("/build", express.static(path.join(projectRoot, "build")));

app.use("/events", (req, res, next) => {
  req.isAuthenticated() ? next() : res.status(401).json({ error: "Not authenticated" });
}, eventsRoute);
app.use("/auth", authRoute);

// main page
app.get("/", (req, res) => {
  res.render("index", {
    googleAuth: req.isAuthenticated(),
  });
});

app.listen(config.PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`> Server ready on http://localhost:${config.PORT}`);
});
