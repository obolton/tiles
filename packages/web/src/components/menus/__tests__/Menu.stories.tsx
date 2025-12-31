import Menu from "../Menu";
import MenuItem from "../MenuItem";
import MenuItemGroup from "../MenuItemGroup";
import MenuItemLink from "../MenuItemLink";
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
  title: "Menu",
} satisfies Meta;
export default meta;

export const BasicMenu: Story = {
  render: () => (
    <Menu>
      <MenuItemGroup>
        <MenuItem icon={<SettingsIcon aria-hidden="true" />}>Settings</MenuItem>
        <MenuItem icon={<SignOutIcon aria-hidden="true" />}>Sign out</MenuItem>
      </MenuItemGroup>
    </Menu>
  ),
};

export const WithMultipleGroups: Story = {
  render: () => (
    <Menu>
      <MenuItemGroup>
        <MenuItemLink
          icon={<WorkspaceIcon aria-hidden="true" />}
          href="#workspace-1"
        >
          My Workspace
        </MenuItemLink>
        <MenuItemLink
          icon={<WorkspaceIcon aria-hidden="true" />}
          href="#workspace-2"
        >
          Team Workspace
        </MenuItemLink>
        <MenuItem icon={<NewIcon aria-hidden="true" />}>
          Create workspace
        </MenuItem>
      </MenuItemGroup>
      <MenuItemGroup>
        <MenuItemLink icon={<SettingsIcon aria-hidden="true" />} href="#">
          Settings
        </MenuItemLink>
        <MenuItem icon={<SignOutIcon aria-hidden="true" />}>Sign out</MenuItem>
      </MenuItemGroup>
    </Menu>
  ),
};

export const WithSelectedItem: Story = {
  render: () => (
    <Menu>
      <MenuItemGroup>
        <MenuItemLink
          icon={<WorkspaceIcon aria-hidden="true" />}
          href="#workspace-1"
          aria-current="true"
        >
          My Workspace
        </MenuItemLink>
        <MenuItemLink
          icon={<WorkspaceIcon aria-hidden="true" />}
          href="#workspace-2"
        >
          Team Workspace
        </MenuItemLink>
      </MenuItemGroup>
    </Menu>
  ),
};

export const WithCheckboxItems: Story = {
  render: () => (
    <Menu>
      <MenuItemGroup label="Text style">
        <MenuItem
          icon={<BoldIcon aria-hidden="true" />}
          checked={true}
          role="menuitemcheckbox"
        >
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
    </Menu>
  ),
};

export const WithDestructiveItem: Story = {
  render: () => (
    <Menu>
      <MenuItemGroup>
        <MenuItem icon={<SettingsIcon aria-hidden="true" />}>Settings</MenuItem>
      </MenuItemGroup>
      <MenuItemGroup>
        <MenuItem icon={<TrashIcon aria-hidden="true" />} destructive>
          Delete workspace
        </MenuItem>
      </MenuItemGroup>
    </Menu>
  ),
};

export const IconsOnly: Story = {
  render: () => (
    <Menu>
      <MenuItemGroup>
        <MenuItem icon={<BoldIcon aria-hidden="true" />} label="Bold" />
        <MenuItem icon={<ItalicIcon aria-hidden="true" />} label="Italic" />
        <MenuItem
          icon={<UnderlineIcon aria-hidden="true" />}
          label="Underline"
        />
      </MenuItemGroup>
    </Menu>
  ),
};
