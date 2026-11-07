import ToolbarButton from "@/components/buttons/ToolbarButton";
import CloseIcon from "@/icons/close.svg?jsx";
import { SIDEBAR_CONSTRAINTS } from "./EditorLayout";
import styles from "./Sidebar.module.css";
import type SidebarPanel from "./SidebarPanel";
import type { JSX } from "jsx/jsx";

export interface SidebarProps extends JSX.Attributes<"resizable-panel"> {
  state: SidebarPanel;
  /** The panel's accessible name, shown as its heading. */
  label: string;
  children: JSX.Node;
}

/** The chrome shared by the editor's end panels: a resizable panel with a heading and a close button. */
export default function Sidebar({ state, label, children, classList, ...props }: SidebarProps) {
  function onKeyDown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      state.close();
    }
  }

  return (
    <resizable-panel
      id={state.panelId}
      classList={{ [styles.panel]: true, ...classList }}
      role="complementary"
      aria-label={label}
      edge="inline-end"
      min={SIDEBAR_CONSTRAINTS.min}
      max={SIDEBAR_CONSTRAINTS.max}
      on:keydown={onKeyDown}
      {...props}
    >
      <div className={styles.header}>
        <h2 className={styles.title}>{label}</h2>
        <ToolbarButton classList={{ small: true }} label="Close" on:click={() => state.close()}>
          <CloseIcon aria-hidden="true" />
        </ToolbarButton>
      </div>

      {children}
    </resizable-panel>
  );
}
