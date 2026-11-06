import { defineEnv } from "env";

// Inlined by Vite at build time, so the values are available on the server and in the browser.
export const publicEnv = defineEnv({
  PUBLIC_API_ORIGIN: import.meta.env.PUBLIC_API_ORIGIN,
  PUBLIC_UPLOAD_ORIGIN: import.meta.env.PUBLIC_UPLOAD_ORIGIN,
  PUBLIC_COLLABORATION_URL: import.meta.env.PUBLIC_COLLABORATION_URL,
  PUBLIC_FONTS_BASE_URL: import.meta.env.PUBLIC_FONTS_BASE_URL,
  PUBLIC_IMAGES_BASE_URL: import.meta.env.PUBLIC_IMAGES_BASE_URL,
  PUBLIC_PROFILE_IMAGES_BASE_URL: import.meta.env.PUBLIC_PROFILE_IMAGES_BASE_URL,
  PUBLIC_SESSION_COOKIE_DOMAIN: import.meta.env.PUBLIC_SESSION_COOKIE_DOMAIN,
  PUBLIC_PAGE_ID: import.meta.env.PUBLIC_PAGE_ID,
});
