import If from "jsx/if";
import { persistent } from "@/utils/persistent";
import { combine, reactive } from "reactivity";
import styles from "./EditorLayout.module.css";
import type { Reactive } from "reactivity";
import type { JSX } from "jsx/jsx";

export const SIDEBAR_CONSTRAINTS = { min: 120, max: 480, default: 200 };

const startWidth = persistent<number>("editor:sidebar-width:start", SIDEBAR_CONSTRAINTS.default);
const endWidth = persistent<number>("editor:sidebar-width:end", SIDEBAR_CONSTRAINTS.default);

function clamp(value: number): number {
  return Math.min(Math.max(value, SIDEBAR_CONSTRAINTS.min), SIDEBAR_CONSTRAINTS.max);
}

export interface EditorLayoutProps {
  start?: JSX.Node;
  end?: JSX.Node;
  endVisible?: Reactive<boolean>;
  children: JSX.Node;
}

export default function EditorLayout({ start, end, endVisible, children }: EditorLayoutProps) {
  const startSize = reactive(clamp(startWidth.value));
  const endSize = reactive(clamp(endWidth.value));
  const isEndVisible = endVisible ?? reactive(true);

  const style = {
    "--sidebar-size-start": start ? startSize.derive((value) => `${value}px`) : "0px",
    "--sidebar-size-end": end
      ? combine({ visible: isEndVisible, size: endSize }, ({ visible, size }) =>
          visible ? `${size}px` : "0px",
        )
      : "0px",
  };

  return (
    <div className={styles.layout} style={style}>
      {start ? (
        <div
          className={styles.start}
          on:panelresize={(event) => (startSize.value = event.size)}
          on:panelresizeend={(event) => (startWidth.value = event.size)}
        >
          {start}
        </div>
      ) : null}

      {children}

      {end ? (
        <If condition={isEndVisible}>
          <div
            className={styles.end}
            on:panelresize={(event) => (endSize.value = event.size)}
            on:panelresizeend={(event) => (endWidth.value = event.size)}
          >
            {end}
          </div>
        </If>
      ) : null}
    </div>
  );
}
