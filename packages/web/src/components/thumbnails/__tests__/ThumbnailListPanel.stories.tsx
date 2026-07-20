import * as Y from "yjs";
import Editor from "@/editor/Editor";
import Section from "@/models/Section";
import ThumbnailListPanel from "../ThumbnailListPanel";
import { flag, reactive, type Reactive } from "@/utils/reactivity";
import { PAGE } from "@/test/fixtures/Page";
import type { Meta, Story } from "@/test/storybook";

const editor = Editor.init({ ...PAGE, type: "PRESENTATION" }, new Y.Doc());

for (let i = 1; i <= 5; i++) {
  editor.page.createTile(
    Section.createMap({
      layout: "FREEFORM",
      sizing: "LANDSCAPE",
      width: null,
      height: 1,
      hide: i === 3,
    }),
    {},
  );
}

const meta = {
  title: "ThumbnailListPanel",
} satisfies Meta;
export default meta;

function Panel({ isEditable }: { isEditable: Reactive<boolean> }) {
  const width = reactive(240);
  const style = width.derive((value) => ({ "--sidebar-width": `${value}px` }));
  return (
    <ThumbnailListPanel
      page={editor.page}
      isEditable={isEditable}
      tiles={editor.page.tiles}
      size={width}
      style={style}
      on:panelresize={(event) => (width.value = event.size)}
      on:panelresizeend={(event) => (width.value = event.size)}
    />
  );
}

export const EditMode: Story = {
  render: () => <Panel isEditable={flag(true)} />,
};

export const ViewMode: Story = {
  render: () => <Panel isEditable={flag(false)} />,
};
