import validateEnv from "./validateEnv";
const env = validateEnv();

export default {
  telegram: {
    apiKey: env.TELEGRAM_API_KEY,
  },
  discord: {
    apiKey: env.DISCORD_API_KEY,
  },
  dext: {
    apiKey: env.DEXT_API_KEY,
    baseUrl: env.DEXT_BASE_URL,
  },
  bitquery: {
    apiKey: env.BITQUERY_API_KEY,
    baseUrl: env.BITQUERY_BASE_URL,
  },
};
