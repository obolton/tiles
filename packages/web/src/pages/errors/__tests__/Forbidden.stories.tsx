import Forbidden from "../Forbidden";
import type { Meta, Story } from "@/test/storybook";

const meta = {
  title: "Errors/Forbidden",
} satisfies Meta;
export default meta;

export const Default: Story = {
  render: () => <Forbidden />,
};
