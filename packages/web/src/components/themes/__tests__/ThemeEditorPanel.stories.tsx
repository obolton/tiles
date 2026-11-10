import * as Y from "yjs";
import ThemeEditorPanel from "../ThemeEditorPanel";
import ThemeEditor from "../ThemeEditor";
import Page from "@/models/Page";
import Theme from "@/models/Theme";
import { PAGE } from "@/test/fixtures/Page";
import { THEME } from "@/test/fixtures/Theme";
import { reactive } from "carillon";
import type { Meta, Story } from "@/test/storybook";

const meta = {
  title: "ThemeEditorPanel",
} satisfies Meta;
export default meta;

function Panel() {
  const state = new ThemeEditor(new Page(PAGE, new Y.Doc()));
  state.edit(new Theme(THEME));

  const width = reactive(280);
  const style = width.derive((value) => ({ "--sidebar-width": `${value}px` }));
  return (
    <ThemeEditorPanel
      state={state}
      size={width}
      style={style}
      on:panelresize={(event) => (width.value = event.size)}
      on:panelresizeend={(event) => (width.value = event.size)}
    />
  );
}

export const Editing: Story = {
  render: () => <Panel />,
};
