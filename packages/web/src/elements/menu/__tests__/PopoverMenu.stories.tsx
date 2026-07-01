import "../PopoverMenu";
import MenuItem from "@/components/menus/MenuItem";
import MenuItemGroup from "@/components/menus/MenuItemGroup";
import MenuItemLink from "@/components/menus/MenuItemLink";
import SettingsIcon from "@/icons/settings.svg?jsx";
import WorkspaceIcon from "@/icons/workspace.svg?jsx";
import NewIcon from "@/icons/new.svg?jsx";
import TrashIcon from "@/icons/trash.svg?jsx";
import SignOutIcon from "@/icons/sign-out.svg?jsx";
import BoldIcon from "@/icons/bold.svg?jsx";
import ItalicIcon from "@/icons/italic.svg?jsx";
import UnderlineIcon from "@/icons/underline.svg?jsx";
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
        <MenuItemGroup>
          <MenuItem>First item</MenuItem>
          <MenuItem>Second item</MenuItem>
          <MenuItem>Third item</MenuItem>
        </MenuItemGroup>
      </popover-menu>
    </>
  ),
};

export const BasicMenu: Story = {
  render: () => (
    <>
      <button id="basic-button" popovertarget="basic-menu">
        Open menu
      </button>
      <popover-menu id="basic-menu">
        <MenuItemGroup>
          <MenuItem icon={<SettingsIcon aria-hidden="true" />}>Settings</MenuItem>
          <MenuItem icon={<SignOutIcon aria-hidden="true" />}>Sign out</MenuItem>
        </MenuItemGroup>
      </popover-menu>
    </>
  ),
};

export const WithMultipleGroups: Story = {
  render: () => (
    <>
      <button id="groups-button" popovertarget="groups-menu">
        Open menu
      </button>
      <popover-menu id="groups-menu">
        <MenuItemGroup>
          <MenuItemLink icon={<WorkspaceIcon aria-hidden="true" />} href="#workspace-1">
            My Workspace
          </MenuItemLink>
          <MenuItemLink icon={<WorkspaceIcon aria-hidden="true" />} href="#workspace-2">
            Team Workspace
          </MenuItemLink>
          <MenuItem icon={<NewIcon aria-hidden="true" />}>Create workspace</MenuItem>
        </MenuItemGroup>
        <MenuItemGroup>
          <MenuItemLink icon={<SettingsIcon aria-hidden="true" />} href="#">
            Settings
          </MenuItemLink>
          <MenuItem icon={<SignOutIcon aria-hidden="true" />}>Sign out</MenuItem>
        </MenuItemGroup>
      </popover-menu>
    </>
  ),
};

export const WithSelectedItem: Story = {
  render: () => (
    <>
      <button id="selected-button" popovertarget="selected-menu">
        Open menu
      </button>
      <popover-menu id="selected-menu">
        <MenuItemGroup>
          <MenuItemLink
            icon={<WorkspaceIcon aria-hidden="true" />}
            href="#workspace-1"
            aria-current="true"
          >
            My Workspace
          </MenuItemLink>
          <MenuItemLink icon={<WorkspaceIcon aria-hidden="true" />} href="#workspace-2">
            Team Workspace
          </MenuItemLink>
        </MenuItemGroup>
      </popover-menu>
    </>
  ),
};

export const WithCheckboxItems: Story = {
  render: () => (
    <>
      <button id="checkbox-button" popovertarget="checkbox-menu">
        Open menu
      </button>
      <popover-menu id="checkbox-menu">
        <MenuItemGroup label="Text style">
          <MenuItem icon={<BoldIcon aria-hidden="true" />} checked={true} role="menuitemcheckbox">
            Bold
          </MenuItem>
          <MenuItem
            icon={<ItalicIcon aria-hidden="true" />}
            checked={false}
            role="menuitemcheckbox"
          >
            Italic
          </MenuItem>
          <MenuItem
            icon={<UnderlineIcon aria-hidden="true" />}
            checked={true}
            role="menuitemcheckbox"
          >
            Underline
          </MenuItem>
        </MenuItemGroup>
      </popover-menu>
    </>
  ),
};

export const WithDestructiveItem: Story = {
  render: () => (
    <>
      <button id="destructive-button" popovertarget="destructive-menu">
        Open menu
      </button>
      <popover-menu id="destructive-menu">
        <MenuItemGroup>
          <MenuItem icon={<SettingsIcon aria-hidden="true" />}>Settings</MenuItem>
        </MenuItemGroup>
        <MenuItemGroup>
          <MenuItem icon={<TrashIcon aria-hidden="true" />} destructive>
            Delete workspace
          </MenuItem>
        </MenuItemGroup>
      </popover-menu>
    </>
  ),
};

export const IconsOnly: Story = {
  render: () => (
    <>
      <button id="icons-button" popovertarget="icons-menu">
        Open menu
      </button>
      <popover-menu id="icons-menu">
        <MenuItemGroup>
          <MenuItem icon={<BoldIcon aria-hidden="true" />} label="Bold" />
          <MenuItem icon={<ItalicIcon aria-hidden="true" />} label="Italic" />
          <MenuItem icon={<UnderlineIcon aria-hidden="true" />} label="Underline" />
        </MenuItemGroup>
      </popover-menu>
    </>
  ),
};
