import "../PopoverMenu";
import type { Meta, Story } from "@/test/storybook";

const meta = {
  title: "PopoverMenu",
} satisfies Meta;
export default meta;

export const Default: Story = {
  render: () => (
    <>
      <button id="button" popovertarget="menu">
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
};
