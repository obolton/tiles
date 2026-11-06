import Folders from "../Folders";
import type { Meta, Story } from "@/test/storybook";

const meta = {
  title: "Folders",
} satisfies Meta;
export default meta;

const WORKSPACE_ID = "ws-1";

const FOLDERS = {
  folders: [
    { id: "folder-1", name: "Design" },
    { id: "folder-2", name: "Marketing campaigns 2026" },
    { id: "folder-3", name: "Research" },
  ],
  nextCursor: null,
};

export const Sidebar: Story = {
  render: () => <Folders workspaceId={WORKSPACE_ID} selectedId="RECENT" folders={FOLDERS} />,
};

export const SelectedFolder: Story = {
  render: () => <Folders workspaceId={WORKSPACE_ID} selectedId="folder-2" folders={FOLDERS} />,
};

export const Phone: Story = {
  render: () => <Folders workspaceId={WORKSPACE_ID} selectedId="folder-2" folders={FOLDERS} />,
  globals: { viewport: { value: "mobile2", isRotated: false } },
};
