// oxlint-disable node/no-process-env
import { defineEnv } from "env";
import { DEFAULT_TEXT_MODEL, DEFAULT_TEXT_PROVIDER } from "@/ai/constants";

export const env = defineEnv({
  NODE_ENV: process.env.NODE_ENV || "development",

  API_HOST: process.env.API_HOST,
  API_PORT: parseInt(process.env.API_PORT ?? "", 10),
  PUBLIC_WEB_ORIGIN: process.env.PUBLIC_WEB_ORIGIN,
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN,
  PAGE_ID: process.env.PAGE_ID,
  PUBLIC_SESSION_COOKIE_DOMAIN: process.env.PUBLIC_SESSION_COOKIE_DOMAIN,
  SERVICE_API_TOKEN: process.env.SERVICE_API_TOKEN,

  DATABASE_URL: process.env.DATABASE_URL,

  PROFILE_IMAGES_BASE_URL: process.env.PROFILE_IMAGES_BASE_URL,
  CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID,
  CLOUDFLARE_R2_ACCESS_KEY_ID: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
  CLOUDFLARE_R2_SECRET_ACCESS_KEY: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  CLOUDFLARE_R2_BUCKET_IMAGES: process.env.CLOUDFLARE_R2_BUCKET_IMAGES,
  CLOUDFLARE_R2_BUCKET_PROFILE_IMAGES: process.env.CLOUDFLARE_R2_BUCKET_PROFILE_IMAGES,
  CLOUDFLARE_API_TOKEN: process.env.CLOUDFLARE_API_TOKEN,
  CLOUDFLARE_ZONE_ID: process.env.CLOUDFLARE_ZONE_ID,

  AWS_REGION: process.env.AWS_REGION,
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
  EMAIL_FROM: process.env.EMAIL_FROM,

  HERE_API_KEY: process.env.HERE_API_KEY,

  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  AI_TEXT_PROVIDER: process.env.AI_TEXT_PROVIDER || DEFAULT_TEXT_PROVIDER,
  AI_TEXT_MODEL: process.env.AI_TEXT_MODEL || DEFAULT_TEXT_MODEL,
});

// Only needed by the matching AI text provider, which is loaded on demand.
export const anthropicEnv = defineEnv({
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
});

export const googleEnv = defineEnv({
  GOOGLE_GENERATIVE_AI_API_KEY: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});
