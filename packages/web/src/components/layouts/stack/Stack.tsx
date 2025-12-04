import styles from "./Stack.module.css";
import Item from "@/components/item/Item";
import { ReactiveValue, Computed, flag } from "@/utils/reactivity";
import LayoutEditor from "@/editor/LayoutEditor";
import type { JSX } from "@/jsx/jsx";
import type { Tile } from "@/types/tiles";
import type Editor from "@/editor/Editor";
import type { Reactive } from "@/utils/reactivity";

interface StackProps {
  editor: Editor;
  sectionId: string;
  items: Reactive<Tile[]>;
  Placeholder?: JSX.Component<Pick<StackProps, "sectionId">>;
}

export default function Stack({
  editor,
  sectionId,
  items,
  Placeholder,
}: StackProps) {
  const open = flag(false);
  const { isEditable, dragId } = editor;

  const ref = (element: HTMLElement) => {
    // TODO: Remove editor at end
    new LayoutEditor({
      element,
      editor,
      sectionId,
    });
  };

  const onToggle = ({ newState }: ToggleEvent) => {
    open.value = newState === "open";
  };

  return (
    <stack-view
      ref={ref}
      className={styles.stack}
      expandable={items.derive((value) =>
        value.length > 0 ? "expandable" : undefined,
      )}
      on:toggle={onToggle}
      data-drop={isEditable.derive((editable) =>
        editable ? "true" : undefined,
      )}
    >
      {items.derive((value) =>
        value.length === 0 ? (
          Placeholder ? (
            <Placeholder sectionId={sectionId} />
          ) : null
        ) : (
          value.map((item, i) => (
            <Item
              editor={editor}
              classList={{
                [styles.item]: true,
                [styles.dragging]: dragId.derive((id) => id === item.id),
              }}
              id={item.id}
              sectionId={sectionId}
              rows={new ReactiveValue(2)}
              columns={new ReactiveValue(1)}
              deletable={
                new Computed(
                  [isEditable, open],
                  (editable, open) => editable && open,
                )
              }
              draggable={
                new Computed(
                  [isEditable, open],
                  (editable, open) => editable && open,
                )
              }
              resizable={false}
              grow={flag(false)}
              style={{
                "--index": i.toString(),
                "--angle": i === 0 ? "0" : `${((i * 123) % 20) - 10}deg`,
              }}
              tile={item}
              tabindex={open.derive((value) => (value ? 0 : undefined))}
            />
          ))
        ),
      )}
    </stack-view>
  );
}
