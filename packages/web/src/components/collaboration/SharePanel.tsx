import PublicLink from "./PublicLink";
import PeopleList from "./PeopleList";
import ToolbarButton from "@/components/buttons/ToolbarButton";
import CloseIcon from "@/icons/close.svg?jsx";
import { SIDEBAR_CONSTRAINTS } from "@/components/pages/EditorLayout";
import { SHARE_PANEL_ID } from "./Share";
import { reactive } from "reactivity";
import styles from "./SharePanel.module.css";
import type Share from "./Share";
import type Editor from "@/editor/Editor";
import type { Reactive } from "reactivity";
import type { JSX } from "@/jsx/jsx";

export interface SharePanelProps extends JSX.Attributes<"resizable-panel"> {
  state: Share;
  editor: Editor;
  /** Overrides the IDs of connected users derived from the editor's presence. */
  online?: Reactive<Set<string>>;
}

export default function SharePanel({
  state,
  editor,
  online,
  classList,
  ...props
}: SharePanelProps) {
  function onKeyDown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      state.close();
    }
  }

  function onlineIds() {
    const presence = editor.collaboration?.presence;
    return (
      online ??
      presence?.derive((peers) => new Set(peers.map((peer) => peer.id))) ??
      reactive(new Set<string>())
    );
  }

  return (
    <resizable-panel
      id={SHARE_PANEL_ID}
      classList={{ "sidebar-panel": true, ...classList }}
      role="complementary"
      aria-label="Share"
      edge="inline-end"
      min={SIDEBAR_CONSTRAINTS.min}
      max={SIDEBAR_CONSTRAINTS.max}
      on:keydown={onKeyDown}
      {...props}
    >
      <div className="sidebar-panel-header">
        <h2 className="sidebar-panel-title">Share</h2>
        <ToolbarButton classList={{ small: true }} label="Close" on:click={() => state.close()}>
          <CloseIcon aria-hidden="true" />
        </ToolbarButton>
      </div>

      <div className={styles.scroll}>
        <PublicLink page={editor.page} />
        {editor.isCollaborating.derive(() => (
          <PeopleList page={editor.page} online={onlineIds()} />
        ))}
      </div>
    </resizable-panel>
  );
}
