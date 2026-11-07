import ServerError from "../ServerError";
import { InternalServerError } from "@/router/errors";
import type { Meta, Story } from "@/test/storybook";

const meta = {
  title: "Errors/Server error",
} satisfies Meta;
export default meta;

export const Default: Story = {
  render: () => <ServerError error={new InternalServerError()} />,
};

export const WithCause: Story = {
  render: () => (
    <ServerError
      error={
        new InternalServerError({
          cause: new TypeError("Cannot read properties of undefined (reading 'title')"),
        })
      }
    />
  ),
};
