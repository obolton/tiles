/// <reference types="vite/client" />

interface ViteTypeOptions {
  // Reject reads of undeclared `import.meta.env` keys.
  strictImportMetaEnv: unknown;
}

interface ImportMetaEnv {
  readonly PUBLIC_API_ORIGIN?: string;
  readonly PUBLIC_UPLOAD_ORIGIN?: string;
  readonly PUBLIC_COLLABORATION_URL?: string;
  readonly PUBLIC_FONTS_BASE_URL?: string;
  readonly PUBLIC_IMAGES_BASE_URL?: string;
  readonly PUBLIC_PROFILE_IMAGES_BASE_URL?: string;
  readonly PUBLIC_SESSION_COOKIE_DOMAIN?: string;
  readonly PUBLIC_PAGE_ID?: string;
  readonly PUBLIC_MAPTILER_API_KEY?: string;
}
