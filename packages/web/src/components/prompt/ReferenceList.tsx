import ReferenceChip from "./ReferenceChip";
import Editor from "@/editor/Editor";
import Each from "@/jsx/each";
import styles from "./ReferenceList.module.css";

export default function ReferenceList() {
  const editor = Editor.current;
  const tiles = editor.references.derive((ids) => editor.page.getTiles(ids));

  return (
    <div className={styles.list}>
      <Each items={tiles}>
        {(tile) => <ReferenceChip tile={tile} onRemove={() => editor.toggleReference(tile.id)} />}
      </Each>
    </div>
  );
}
