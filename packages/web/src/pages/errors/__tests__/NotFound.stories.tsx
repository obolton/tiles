import NotFound from "../NotFound";
import type { Meta, Story } from "@/test/storybook";

const meta = {
  title: "Errors/Not found",
} satisfies Meta;
export default meta;

export const Default: Story = {
  render: () => <NotFound />,
};
