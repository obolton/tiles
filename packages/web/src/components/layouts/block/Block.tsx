import { flag, reactive, Computed, type Reactive } from "@/utils/reactivity";
import { toCSSColor } from "@/utils/color";
import If from "@/jsx/if";
import styles from "./Block.module.css";
import NewIcon from "@/icons/new.svg?jsx";
import { handleError } from "@/utils/errors";
import type Editor from "@/editor/Editor";
import type { JSX } from "@/jsx/jsx";
import type { Background } from "@/components/backgrounds/types";

function preventDefault(event: Event) {
  event.preventDefault();
}

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

  function insertItem() {
    editor.createSection({ afterId: tileId }).catch(handleError);
  }

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

  const style = new Computed([background] as const, (backgroundValue) => ({
    "--background-color":
      backgroundValue && "color" in backgroundValue
        ? toCSSColor(backgroundValue.color)
        : "transparent",
    backgroundImage:
      backgroundValue && "imageUrl" in backgroundValue
        ? `url(${backgroundValue.imageUrl})`
        : undefined,
  }));

  const show = new Computed(
    [editor.isEditable, hide] as const,
    (editable, hidden) => !hidden || editable,
  );

  return (
    <If condition={show}>
      <section
        className={styles.block}
        style={style}
        on:focusin={onFocusIn}
        on:focusout={onFocusOut}
      >
        {children}

        <If condition={hasFocus}>
          <button
            type="button"
            classList={{ floating: true, small: true, [styles.insert]: true }}
            aria-label="Insert item"
            data-tooltip="Insert item"
            on:pointerdown={preventDefault}
            on:click={insertItem}
          >
            <NewIcon aria-hidden="true" />
          </button>
        </If>
      </section>
    </If>
  );
}
