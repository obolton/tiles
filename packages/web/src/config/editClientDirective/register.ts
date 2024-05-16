import type { AstroIntegration } from "astro";

export default (): AstroIntegration => ({
  name: "client:edit",
  hooks: {
    "astro:config:setup": ({ addClientDirective }) => {
      addClientDirective({
        name: "edit",
        entrypoint: "./src/config/editClientDirective/directive.ts",
      });
    },
  },
});
