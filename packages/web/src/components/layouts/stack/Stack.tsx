import styles from "./Stack.module.css";
import GridItem from "@/components/grid/GridItem";
import { ReactiveValue, Computed } from "@/utils/reactivity";
import LayoutEditor from "@/editor/LayoutEditor";
import type { JSX } from "@/jsx/jsx";
import type { Tile } from "@/types/layout";
import type Editor from "@/editor/Editor";

interface StackProps {
  editor: Editor;
  collectionId: string;
  items: ReactiveValue<Tile[]>;
  Placeholder?: JSX.Component<Pick<StackProps, "collectionId">>;
}

export default function Stack({
  editor,
  collectionId,
  items,
  Placeholder,
}: StackProps) {
  const open = new ReactiveValue(false);
  const { isEditable, dragId } = editor;

  const ref = (element: HTMLElement) => {
    // TODO: Remove editor at end
    new LayoutEditor({
      element,
      editor,
      collectionId,
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
      // @ts-expect-error Incorrect event type
      ontoggle={onToggle}
      data-drop={isEditable.derive((editable) =>
        editable ? "true" : undefined,
      )}
    >
      {items.derive((value) =>
        value.length === 0 ? (
          Placeholder ? (
            <Placeholder collectionId={collectionId} />
          ) : null
        ) : (
          value.map((item, i) => (
            <GridItem
              editor={editor}
              classList={{
                [styles.item]: true,
                [styles.dragging]: dragId.derive(
                  (id) => id === item.placementId,
                ),
              }}
              id={item.id}
              collectionId={collectionId}
              placementId={item.placementId}
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
              grow={false}
              style={{
                "--index": i.toString(),
                "--angle": i === 0 ? "0" : `${((i * 123) % 20) - 10}deg`,
              }}
              tile={item}
              tabIndex={open.derive((value) => (value ? 0 : undefined))}
            />
          ))
        ),
      )}
    </stack-view>
  );
}
