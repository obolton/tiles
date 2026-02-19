import "../PopoverMenu";
import Menu from "@/components/menus/Menu";
import MenuItem from "@/components/menus/MenuItem";
import MenuItemGroup from "@/components/menus/MenuItemGroup";
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
      <popover-menu id="menu">
        <Menu>
          <MenuItemGroup>
            <MenuItem>First item</MenuItem>
            <MenuItem>Second item</MenuItem>
            <MenuItem>Third item</MenuItem>
          </MenuItemGroup>
        </Menu>
      </popover-menu>
    </>
  ),
};
