import type { JSX } from "jsx/jsx";
import type { Parameters } from "@storybook/html-vite";
import type { Globals } from "storybook/internal/types";

export type { Meta } from "@storybook/html-vite";

export interface Story {
  render?: () => JSX.Node;
  parameters?: Parameters;
  globals?: Globals;
}
