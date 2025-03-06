import "../TableOfContents";
import type { Meta, StoryObj } from "@storybook/react";

const meta = {
  title: "TableOfContents",
} satisfies Meta;
export default meta;

export const Default = {
  render: () => (
    <>
      <button id="button" popoverTarget="menu">
        Open menu
      </button>
      <table-of-contents id="menu" anchor="button" />
      <h1>Heading 1</h1>
      <h2>Heading 2</h2>
      <h3>Heading 3</h3>
    </>
  ),
} satisfies StoryObj;
