import "../PopoverMenu";
import type { Meta, StoryObj } from "@storybook/html-vite";
import { renderStory } from "@/test/storybook";

const meta = {
  title: "PopoverMenu",
} satisfies Meta;
export default meta;

export const Default = {
  render: () =>
    renderStory(
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
      </>,
    ),
} satisfies StoryObj;
