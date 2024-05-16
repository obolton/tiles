import "astro";

declare module "astro" {
  interface AstroClientDirectives {
    "client:edit"?: boolean;
  }
}
