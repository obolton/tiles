import VersionHistoryPanel from "../VersionHistoryPanel";
import VersionHistory from "../VersionHistory";
import { AUTO_VERSION, VERSIONS } from "@/test/fixtures/PageVersion";
import { reactive } from "@/utils/reactivity";
import type { VersionEntry } from "../VersionHistory";
import type { Meta, Story } from "@/test/storybook";

const meta = {
  title: "VersionHistoryPanel",
} satisfies Meta;
export default meta;

function createState(versions: VersionEntry[]) {
  const state = new VersionHistory("page-id");
  state.versions.value = versions;
  return state;
}

function Panel({ state }: { state: VersionHistory }) {
  const width = reactive(280);
  const style = width.derive((value) => ({ "--sidebar-width": `${value}px` }));
  return (
    <VersionHistoryPanel
      state={state}
      size={width}
      style={style}
      on:panelresize={(event) => (width.value = event.size)}
      on:panelresizeend={(event) => (width.value = event.size)}
    />
  );
}

export const Populated: Story = {
  render: () => <Panel state={createState(VERSIONS)} />,
};

export const Selected: Story = {
  render: () => {
    const state = createState(VERSIONS);
    state.selectedId.value = AUTO_VERSION.id;
    return <Panel state={state} />;
  },
};

export const Empty: Story = {
  render: () => <Panel state={createState([])} />,
};

export const Loading: Story = {
  render: () => {
    const state = createState([]);
    state.isLoading.on();
    return <Panel state={state} />;
  },
};
