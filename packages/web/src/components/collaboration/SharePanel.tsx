import PublicLink from "./PublicLink";
import PeopleList from "./PeopleList";
import Sidebar from "@/components/pages/Sidebar";
import { reactive } from "reactivity";
import styles from "./SharePanel.module.css";
import type Share from "./Share";
import type Editor from "@/editor/Editor";
import type { Reactive } from "reactivity";
import type { JSX } from "jsx/jsx";

export interface SharePanelProps extends JSX.Attributes<"resizable-panel"> {
  state: Share;
  editor: Editor;
  /** Overrides the IDs of connected users derived from the editor's presence. */
  online?: Reactive<Set<string>>;
}

export default function SharePanel({ state, editor, online, ...props }: SharePanelProps) {
  function onlineIds() {
    const presence = editor.collaboration?.presence;
    return (
      online ??
      presence?.derive((peers) => new Set(peers.map((peer) => peer.id))) ??
      reactive(new Set<string>())
    );
  }

  return (
    <Sidebar state={state} label="Share" {...props}>
      <div className={styles.scroll}>
        <PublicLink page={editor.page} />
        {editor.isCollaborating.derive(() => (
          <PeopleList page={editor.page} online={onlineIds()} />
        ))}
      </div>
    </Sidebar>
  );
}
