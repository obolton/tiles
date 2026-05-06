import Editor from "@/editor/Editor";
import FilmstripPanel from "../FilmstripPanel";
import { flag } from "@/utils/reactivity";
import { PAGE } from "@/test/fixtures/Page";
import { SECTION_TILE } from "@/test/fixtures/Tile";
import type { Meta, Story } from "@/test/storybook";
import type { ClientSectionTile } from "api/types/tiles";

function slide(
  id: string,
  overrides: Partial<ClientSectionTile> = {},
): ClientSectionTile {
  return {
    ...SECTION_TILE,
    id,
    sectionId: null,
    layout: "FREEFORM",
    sizing: "LANDSCAPE",
    width: null,
    height: 1,
    ...overrides,
  };
}

const editor = Editor.init({
  ...PAGE,
  type: "PRESENTATION",
  tiles: [
    slide("slide-1"),
    slide("slide-2"),
    slide("slide-3", { hide: true }),
    slide("slide-4"),
    slide("slide-5"),
  ],
});

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
