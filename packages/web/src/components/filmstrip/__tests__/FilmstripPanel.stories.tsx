import * as Y from "yjs";
import Editor from "@/editor/Editor";
import Section from "@/models/Section";
import FilmstripPanel from "../FilmstripPanel";
import { flag } from "@/utils/reactivity";
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
  title: "FilmstripPanel",
} satisfies Meta;
export default meta;

export const EditMode: Story = {
  render: () => (
    <FilmstripPanel
      page={editor.page}
      isEditable={flag(true)}
      tiles={editor.page.tiles}
    />
  ),
};

export const ViewMode: Story = {
  render: () => (
    <FilmstripPanel
      page={editor.page}
      isEditable={flag(false)}
      tiles={editor.page.tiles}
    />
  ),
};
