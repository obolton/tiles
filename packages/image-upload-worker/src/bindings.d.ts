declare global {
  namespace Cloudflare {
    interface Env {
      PUBLIC_WEB_ORIGIN: string;
      INTERNAL_API_ORIGIN: string;
    }
  }
}

export {};
