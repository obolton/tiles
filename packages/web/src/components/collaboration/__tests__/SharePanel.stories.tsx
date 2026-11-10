import * as Y from "yjs";
import SharePanel from "../SharePanel";
import Editor from "@/editor/Editor";
import PageInvite from "@/models/PageInvite";
import { PAGE } from "@/test/fixtures/Page";
import { PAGE_INVITE } from "@/test/fixtures/PageInvite";
import { reactive } from "carillon";
import type { PageAccess } from "@/types/collaboration";
import type { Meta, Story } from "@/test/storybook";

const meta = {
  title: "SharePanel",
} satisfies Meta;
export default meta;

const editor = Editor.init(PAGE, new Y.Doc());
const { page } = editor;

const EDITORS: PageAccess[] = [
  { user: { id: "ada", name: "Ada Lovelace", imageUrl: null } },
  { user: { id: "grace", name: "Grace Hopper", imageUrl: null } },
];

interface PanelOptions {
  published?: boolean;
  access?: PageAccess[];
  invites?: boolean;
  online?: string[];
}

function Panel({ published = true, access = [], invites = false, online = [] }: PanelOptions) {
  page.isPublished.value = published;
  page.access.replace(access);
  page.invites.replace(invites ? [new PageInvite(page, PAGE_INVITE)] : []);

  const width = reactive(280);
  const style = width.derive((value) => ({ "--sidebar-width": `${value}px` }));
  return (
    <SharePanel
      state={editor.share}
      editor={editor}
      online={reactive(new Set(online))}
      size={width}
      style={style}
      on:panelresize={(event) => (width.value = event.size)}
      on:panelresizeend={(event) => (width.value = event.size)}
    />
  );
}

export const Unpublished: Story = {
  render: () => <Panel published={false} />,
};

export const Published: Story = {
  render: () => <Panel />,
};

export const WithPeople: Story = {
  render: () => <Panel access={EDITORS} invites />,
};

export const Online: Story = {
  render: () => <Panel access={EDITORS} online={["ada"]} />,
};

export const Phone: Story = {
  render: () => <Panel access={EDITORS} invites />,
  globals: { viewport: { value: "mobile2", isRotated: false } },
};
