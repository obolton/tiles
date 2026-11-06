import SignIn from "../SignIn";
import type { Meta, Story } from "@/test/storybook";

const meta = {
  title: "Sign in",
} satisfies Meta;
export default meta;

export const Default: Story = {
  render: () => <SignIn destination={null} error={null} />,
};

export const WithDestination: Story = {
  render: () => <SignIn destination="invites/accept/abc123" error={null} />,
};

export const Cancelled: Story = {
  render: () => <SignIn destination={null} error="cancelled" />,
};

export const Failed: Story = {
  render: () => <SignIn destination={null} error="failed" />,
};
