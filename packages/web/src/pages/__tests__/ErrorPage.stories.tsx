import ErrorPage from "../ErrorPage";
import type { Meta, Story } from "@/test/storybook";

const meta = {
  title: "Error page",
} satisfies Meta;
export default meta;

export const NotFound: Story = {
  render: () => <ErrorPage status={404} />,
};

export const Forbidden: Story = {
  render: () => <ErrorPage status={403} />,
};

export const ServerError: Story = {
  render: () => <ErrorPage status={500} />,
};

export const ServerErrorWithDetails: Story = {
  render: () => (
    <ErrorPage
      status={500}
      details={
        "TypeError: Cannot read properties of undefined\n    at loader (/src/routes/pages/[id].ts:32:18)"
      }
    />
  ),
};
