import ThemePreview from "../ThemePreview";
import { THEME, DARK_THEME } from "@/test/fixtures/Theme";
import { reactive } from "carillon";
import type { ThemeData } from "@/models/Theme";
import type { Meta, Story } from "@/test/storybook";

const meta = {
  title: "ThemePreview",
} satisfies Meta;
export default meta;

const GRADIENT_THEME: ThemeData = {
  ...THEME,
  name: "Ocean",
  background: {
    type: "gradient",
    colorA: "080810103030",
    colorB: "181860609090",
    direction: "VERTICAL",
  },
  colors: { text: "e0e0e8e8f0f0", accent: "4040a0a0d8d8" },
};

export const Light: Story = {
  render: () => <ThemePreview theme={reactive(THEME)} />,
};

export const Dark: Story = {
  render: () => <ThemePreview theme={reactive(DARK_THEME)} />,
};

export const Gradient: Story = {
  render: () => <ThemePreview theme={reactive(GRADIENT_THEME)} />,
};
