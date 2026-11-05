import { defineEnv } from "env";

// Server-only values. Isomorphic modules may import this, but in the browser `process` does not
// exist and every value is missing, so only read them during SSR.
const source: NodeJS.ProcessEnv = typeof process === "undefined" ? {} : process.env;

export const serverEnv = defineEnv({
  required: {
    INTERNAL_API_ORIGIN: source.INTERNAL_API_ORIGIN,
    SERVICE_API_TOKEN: source.SERVICE_API_TOKEN,
    GOOGLE_CLIENT_ID: source.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: source.GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI: source.GOOGLE_REDIRECT_URI,
  },
});
