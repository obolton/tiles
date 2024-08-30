import PageHeader from "../PageHeader";
import type { Meta, StoryObj } from "@storybook/react";

const meta = {
  title: "Page Header",
  component: PageHeader,
} satisfies Meta<typeof PageHeader>;
export default meta;

export const WithSubtitle = {
  args: {
    pageId: "id",
    title: "Page title",
    subtitle: "Subtitle",
  },
} satisfies StoryObj<typeof PageHeader>;

export const WithoutSubtitle = {
  args: {
    pageId: "id",
    title: "Page title",
  },
} satisfies StoryObj<typeof PageHeader>;
