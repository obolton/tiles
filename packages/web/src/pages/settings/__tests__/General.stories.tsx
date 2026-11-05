import General from "../General";
import type { Meta, Story } from "@/test/storybook";
import type { GeneralProps } from "../General";

const meta = {
  title: "General settings",
} satisfies Meta;
export default meta;

const USER: GeneralProps["user"] = {
  id: "user-1",
  name: "Jane Smith",
  username: "jane",
  email: "jane@example.com",
  imageUrl: null,
  imageKey: null,
  workspaces: [{ id: "ws-1", name: "Personal" }],
};

const WORKSPACE: GeneralProps["workspace"] = {
  id: "ws-1",
  name: "Personal",
  role: "ADMIN",
};

export const Admin: Story = {
  render: () => <General workspace={WORKSPACE} user={USER} />,
};

export const Member: Story = {
  render: () => <General workspace={{ ...WORKSPACE, role: "MEMBER" }} user={USER} />,
};
