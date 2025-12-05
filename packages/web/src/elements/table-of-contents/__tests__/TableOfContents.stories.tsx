import "../TableOfContents";
import type { Meta, Story } from "@/test/storybook";

const meta = {
  title: "TableOfContents",
} satisfies Meta;
export default meta;

export const Default: Story = {
  render: () => (
    <>
      <button id="button" popovertarget="menu">
        Open menu
      </button>
      <table-of-contents id="menu" anchor="button" />
      <h1>Heading 1</h1>
      <h2>Heading 2</h2>
      <h3>Heading 3</h3>
    </>
  ),
};
