import { flag, reactive, Computed, type Reactive } from "@/utils/reactivity";
import { getBackgroundStyle } from "@/utils/backgrounds";
import If from "@/jsx/if";
import styles from "./Block.module.css";
import InsertButton from "@/components/buttons/InsertButton";
import type Editor from "@/editor/Editor";
import type { JSX } from "@/jsx/jsx";
import type { Background } from "@/components/backgrounds/types";

export interface BlockProps {
  tileId: string;
  editor: Editor;
  hide: Reactive<boolean>;
  background?: Reactive<Background | null>;
  children: JSX.Node;
}

export default function Block({
  tileId,
  editor,
  hide,
  background = reactive(null),
  children,
}: BlockProps) {
  const hasFocus = flag(false);

  function onFocusIn() {
    if (editor.isEditable.value) {
      hasFocus.on();
    }
  }

  function onFocusOut(event: FocusEvent) {
    const currentTarget = event.currentTarget as HTMLElement;
    const relatedTarget = event.relatedTarget;
    if (
      !(relatedTarget instanceof Element) ||
      !currentTarget.contains(relatedTarget)
    ) {
      hasFocus.off();
    }
  }

  const style = background.derive(getBackgroundStyle);

  const show = new Computed(
    [editor.isEditable, hide] as const,
    (editable, hidden) => !hidden || editable,
  );

  return (
    <If condition={show}>
      <section
        className={styles.block}
        style={style}
        data-id={tileId}
        on:focusin={onFocusIn}
        on:focusout={onFocusOut}
      >
        {children}

        <If condition={hasFocus}>
          <InsertButton
            id={`${tileId}-insert-button`}
            classList={{ small: true, [styles.insert]: true }}
            sectionId={null}
            afterId={tileId}
          />
        </If>
      </section>
    </If>
  );
}
