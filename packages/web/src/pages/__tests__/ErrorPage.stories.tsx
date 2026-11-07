import ErrorPage from "../ErrorPage";
import type { Meta, Story } from "@/test/storybook";

const meta = {
  title: "Error page",
} satisfies Meta;
export default meta;

const PAGE_PATH = "/pages/b8c96309-cc54-445b-a274-98b6be12c43f";
const PAGE_DESTINATION = "pages/b8c96309-cc54-445b-a274-98b6be12c43f";

export const NotFound: Story = {
  render: () => <ErrorPage status={404} path="/missing" destination={null} signedIn={false} />,
};

export const NotFoundSignedOutPage: Story = {
  render: () => (
    <ErrorPage status={404} path={PAGE_PATH} destination={PAGE_DESTINATION} signedIn={false} />
  ),
};

export const NotFoundSignedIn: Story = {
  render: () => (
    <ErrorPage status={404} path={PAGE_PATH} destination={PAGE_DESTINATION} signedIn={true} />
  ),
};

export const Forbidden: Story = {
  render: () => (
    <ErrorPage status={403} path={PAGE_PATH} destination={PAGE_DESTINATION} signedIn={true} />
  ),
};

export const ServerError: Story = {
  render: () => (
    <ErrorPage status={500} path="/pages/abc?edit=1" destination={null} signedIn={true} />
  ),
};

export const ServerErrorWithDetails: Story = {
  render: () => (
    <ErrorPage
      status={500}
      path="/pages/abc"
      destination={null}
      signedIn={false}
      details={
        "TypeError: Cannot read properties of undefined\n    at loader (/src/routes/pages/[id].ts:32:18)"
      }
    />
  ),
};
