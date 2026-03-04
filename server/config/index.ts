import dotenv from "dotenv-flow";
import type { AppConfig } from "../types/auth.types.ts";

dotenv.config();

const config: AppConfig = {
  PORT: Number(process.env.PORT || 3000),
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI,
  SESSION_SECRET: process.env.SESSION_SECRET,
};

export default config;
