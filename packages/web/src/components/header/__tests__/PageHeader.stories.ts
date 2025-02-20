import PageHeader from "../PageHeader";
import type { Meta, StoryObj } from "@storybook/react";
import { EditorDecorator } from "@/test/storybook/decorators";

const meta = {
  title: "Page Header",
  component: PageHeader,
  decorators: [EditorDecorator],
} satisfies Meta<typeof PageHeader>;
export default meta;

export const WithSubtitle = {
  args: {
    title: "Page title",
    subtitle: "Subtitle",
  },
} satisfies StoryObj<typeof PageHeader>;

export const WithoutSubtitle = {
  args: {
    title: "Page title",
  },
} satisfies StoryObj<typeof PageHeader>;
