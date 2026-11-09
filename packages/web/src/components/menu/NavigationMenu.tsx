import ToolbarButton from "@/components/buttons/ToolbarButton";
import MenuItem from "@/components/menus/MenuItem";
import MenuItemGroup from "@/components/menus/MenuItemGroup";
import MenuItemLink from "@/components/menus/MenuItemLink";
import ProfileImage from "@/components/profile-image/ProfileImage";
import LibraryIcon from "@/icons/library.svg?jsx";
import NewIcon from "@/icons/new.svg?jsx";
import WorkspaceIcon from "@/icons/workspace.svg?jsx";
import SettingsIcon from "@/icons/settings.svg?jsx";
import SignOutIcon from "@/icons/sign-out.svg?jsx";
import { getUserInfo, signOut } from "@/utils/sessions";
import { showModal } from "@/utils/modals";
import client from "@/api/client";
import styles from "./NavigationMenu.module.css";
import type { User } from "@/utils/sessions";

const CreateWorkspaceModalLoader = () =>
  import("@/components/modals/workspaces/CreateWorkspaceModal");

function createWorkspace() {
  void showModal(CreateWorkspaceModalLoader, {
    props: {},
    async onConfirm({ name }) {
      const { id } = await client.workspaces.create.mutate({ name });
      await getUserInfo();
      window.open(`/workspaces/${id}`, "_blank");
    },
  });
}

export interface NavigationMenuProps {
  user: User;
  workspaceId: string;
}

export default function NavigationMenu({ user, workspaceId }: NavigationMenuProps) {
  const workspace = user.workspaces.find((w) => w.id === workspaceId);

  return (
    <>
      <ToolbarButton
        classList={{ [styles.button]: true }}
        popovertarget="navigation-menu"
        aria-haspopup="menu"
      >
        <ProfileImage classList={{ icon: true }} imageUrl={user.imageUrl} name={user.name} />
        <span className={styles.name}>{workspace?.name}</span>
      </ToolbarButton>
      <popover-menu id="navigation-menu">
        <MenuItemGroup>
          <MenuItemLink
            icon={<LibraryIcon aria-hidden="true" />}
            href={`/workspaces/${workspaceId}`}
          >
            Library
          </MenuItemLink>
        </MenuItemGroup>
        <MenuItemGroup>
          {user.workspaces.map((w) => (
            <MenuItemLink
              icon={<WorkspaceIcon aria-hidden="true" />}
              href={`/workspaces/${w.id}`}
              aria-current={w.id === workspaceId}
            >
              {w.name}
            </MenuItemLink>
          ))}
          {user.workspaces.length < 5 ? (
            <MenuItem icon={<NewIcon aria-hidden="true" />} on:click={createWorkspace}>
              Create workspace
            </MenuItem>
          ) : null}
        </MenuItemGroup>
        <MenuItemGroup>
          <MenuItemLink
            icon={<SettingsIcon aria-hidden="true" />}
            href={`/workspaces/${workspaceId}/settings`}
          >
            Settings
          </MenuItemLink>
          <MenuItem icon={<SignOutIcon aria-hidden="true" />} on:click={signOut}>
            Sign out
          </MenuItem>
        </MenuItemGroup>
      </popover-menu>
    </>
  );
}
