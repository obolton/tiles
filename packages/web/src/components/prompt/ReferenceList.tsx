import ReferenceChip from "./ReferenceChip";
import Editor from "@/editor/Editor";
import Each from "@/jsx/each";
import styles from "./ReferenceList.module.css";

export default function ReferenceList() {
  const editor = Editor.current;

  return (
    <div className={styles.list}>
      <Each items={editor.references}>
        {(tile) => (
          <ReferenceChip
            tile={tile}
            onRemove={() => editor.toggleReference(tile.id)}
          />
        )}
      </Each>
    </div>
  );
}
