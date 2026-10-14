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

// The preview constructor fetches the version list; stub it out in Storybook
class StaticVersionHistory extends VersionHistory {
  override async refresh() {}
}

function createState(versions: VersionEntry[], previewVersion: VersionEntry | null = null) {
  const state = new StaticVersionHistory("page-id", previewVersion);
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
  parameters: {
    a11y: {
      // Version subtitles use the global --secondary-text-color token, which is below the AA
      // contrast threshold by design.
      test: "todo",
    },
  },
};

export const Preview: Story = {
  render: () => <Panel state={createState(VERSIONS, AUTO_VERSION)} />,
  parameters: {
    a11y: {
      // Version subtitles use the global --secondary-text-color token, which is below the AA
      // contrast threshold by design.
      test: "todo",
    },
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
