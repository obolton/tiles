import type { Meta, StoryObj } from "@storybook/react";

const meta = {
  title: "PopoverMenu",
} satisfies Meta;
export default meta;

export const Default = {
  render: () => (
    <>
      <button id="button" popoverTarget="menu">
        Open menu
      </button>
      <popover-menu id="menu" anchor="button">
        <menu>
          <li>
            <button>First item</button>
          </li>
          <li>
            <button>Second item</button>
          </li>
        </menu>
      </popover-menu>
    </>
  ),
} satisfies StoryObj;
