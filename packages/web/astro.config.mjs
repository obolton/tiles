import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import editClientDirective from "./src/config/editClientDirective/register";

// https://astro.build/config
export default defineConfig({
  integrations: [react(), editClientDirective()],
});
