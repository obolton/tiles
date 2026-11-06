import * as Y from "yjs";
import Editor from "@/editor/Editor";
import Header from "../Header";
import HeaderActions from "../HeaderActions";
import PageTitle from "../PageTitle";
import { PAGE } from "@/test/fixtures/Page";
import type { Meta, Story } from "@/test/storybook";
import type { User } from "@/utils/sessions";

const editor = Editor.init({ ...PAGE, title: "A document with a fairly long title" }, new Y.Doc());

const USER: User = {
  id: "user-1",
  name: "Jane Smith",
  username: "jane",
  email: "jane@example.com",
  imageUrl: null,
  imageKey: null,
  workspaces: [{ id: PAGE.workspaceId, name: "Personal" }],
};

const meta = {
  title: "HeaderActions",
} satisfies Meta;
export default meta;

function EditorHeader({ editing }: { editing: boolean }) {
  // Set the flag directly: setEditable would start collaboration
  editor.isEditable.value = editing;
  return (
    <Header
      user={USER}
      workspaceId={PAGE.workspaceId}
      center={<PageTitle page={editor.page} isEditable={editor.isEditable} />}
      actions={<HeaderActions editor={editor} />}
      stacked
    />
  );
}

export const ViewMode: Story = {
  render: () => <EditorHeader editing={false} />,
};

export const EditMode: Story = {
  render: () => <EditorHeader editing />,
};

export const ViewModePhone: Story = {
  render: () => <EditorHeader editing={false} />,
  globals: { viewport: { value: "mobile2", isRotated: false } },
};

export const EditModePhone: Story = {
  render: () => <EditorHeader editing />,
  globals: { viewport: { value: "mobile2", isRotated: false } },
};
