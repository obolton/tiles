import type { JSX } from "jsx/jsx";
import type { Parameters } from "@storybook/html-vite";

export type { Meta } from "@storybook/html-vite";

export interface Story {
  render?: () => JSX.Node;
  parameters?: Parameters;
}
