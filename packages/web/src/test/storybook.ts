import type { JSX } from "@/jsx/jsx";

export type { Meta } from "@storybook/html-vite";

export interface Story {
  render?: () => JSX.Node;
}
