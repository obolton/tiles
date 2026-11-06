import VideoModal from "../VideoModal";
import type { Meta, Story } from "@/test/storybook";

const meta = {
  title: "Video modal",
} satisfies Meta;
export default meta;

export const Default: Story = {
  render: () => <VideoModal cancel={() => {}} confirm={() => {}} />,
};
