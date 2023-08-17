import * as dotenv from "dotenv";
import { cleanEnv, str } from "envalid";
dotenv.config();

const validateEnv = () => {
  return cleanEnv(process.env, {
    TELEGRAM_API_KEY: str(),
    DISCORD_API_KEY: str(),
    DEXT_API_KEY: str(),
    DEXT_BASE_URL: str(),
    BITQUERY_BASE_URL: str(),
    BITQUERY_API_KEY: str(),
  });
};

export default validateEnv;
