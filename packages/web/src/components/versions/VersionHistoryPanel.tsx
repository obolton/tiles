import VersionList from "./VersionList";
import ToolbarButton from "@/components/buttons/ToolbarButton";
import CloseIcon from "@/icons/close.svg?jsx";
import { SIDEBAR_CONSTRAINTS } from "@/components/pages/EditorLayout";
import { VERSION_HISTORY_PANEL_ID } from "./VersionHistory";
import type VersionHistory from "./VersionHistory";
import type { JSX } from "@/jsx/jsx";

export interface VersionHistoryPanelProps extends JSX.Attributes<"resizable-panel"> {
  state: VersionHistory;
}

export default function VersionHistoryPanel({
  state,
  classList,
  ...props
}: VersionHistoryPanelProps) {
  function onKeyDown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      state.close();
    }
  }

  return (
    <resizable-panel
      id={VERSION_HISTORY_PANEL_ID}
      classList={{ "sidebar-panel": true, ...classList }}
      role="complementary"
      aria-label="Version history"
      edge="inline-end"
      min={SIDEBAR_CONSTRAINTS.min}
      max={SIDEBAR_CONSTRAINTS.max}
      on:keydown={onKeyDown}
      {...props}
    >
      <div className="sidebar-panel-header">
        <h2 className="sidebar-panel-title">Version history</h2>
        <ToolbarButton classList={{ small: true }} label="Close" on:click={() => state.close()}>
          <CloseIcon aria-hidden="true" />
        </ToolbarButton>
      </div>

      <VersionList state={state} />
    </resizable-panel>
  );
}
