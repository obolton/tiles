import DeleteWorkspaceModal from "../DeleteWorkspaceModal";
import type { Meta, Story } from "@/test/storybook";

const meta = {
  title: "Delete workspace modal",
} satisfies Meta;
export default meta;

export const Default: Story = {
  render: () => <DeleteWorkspaceModal name="Personal" cancel={() => {}} confirm={() => {}} />,
};
