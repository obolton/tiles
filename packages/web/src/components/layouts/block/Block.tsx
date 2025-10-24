import { flag, reactive, Computed, type Reactive } from "@/utils/reactivity";
import { toCSSColor } from "@/utils/color";
import If from "@/jsx/if";
import Editor from "@/editor/Editor";
import styles from "./Block.module.css";
import NewIcon from "@/icons/new.svg?jsx";
import { handleError } from "@/utils/errors";
import type { JSX } from "@/jsx/jsx";
import type { Background } from "@/components/backgrounds/types";

function preventDefault(event: Event) {
  event.preventDefault();
}

export interface BlockProps {
  tileId: string;
  background?: Reactive<Background | null>;
  children: JSX.Node;
}

export default function Block({
  tileId,
  background = reactive(null),
  children,
}: BlockProps) {
  const hasFocus = flag(false);

  function insertItem() {
    Editor.current.createSection({ afterSectionId: tileId }).catch(handleError);
  }

  function onFocusIn() {
    if (Editor.current.isEditable.value) {
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

  return (
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
  );
}
