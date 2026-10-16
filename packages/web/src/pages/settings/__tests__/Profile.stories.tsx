import Profile from "../Profile";
import profileImageUrl from "@/test/fixtures/profile-image.svg?url";
import type { Meta, Story } from "@/test/storybook";
import type { ProfileProps } from "../Profile";

const meta = {
  title: "Profile settings",
} satisfies Meta;
export default meta;

const USER: ProfileProps["user"] = {
  id: "user-1",
  name: "Jane Smith",
  username: "jane",
  email: "jane@example.com",
  imageUrl: null,
  imageKey: null,
  workspaces: [{ id: "ws-1", name: "Personal" }],
};

export const WithProfileImage: Story = {
  render: () => (
    <Profile
      workspaceId="ws-1"
      user={{
        ...USER,
        imageKey: "image-1",
        imageUrl: new URL(profileImageUrl, location.href).href,
      }}
      isAdmin={false}
    />
  ),
};

export const WithoutProfileImage: Story = {
  render: () => <Profile workspaceId="ws-1" user={USER} isAdmin={false} />,
};
