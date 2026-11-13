import * as Y from "yjs";
import Editor from "@/editor/Editor";
import { setEditMode } from "@/utils/edit";
import { PAGE } from "@/test/fixtures/Page";
import type { PageData } from "@/models/Page";

interface CreateEditorOptions {
  /** Merged onto the `PAGE` fixture. */
  page?: Partial<PageData>;
  /** Defaults to editable, which starts the stubbed collaboration session. */
  editable?: boolean;
}

let current: Editor | null = null;

export function createEditor({ page, editable = true }: CreateEditorOptions = {}): Editor {
  current?.dispose();
  setEditMode(false);
  current = Editor.init({ ...PAGE, ...page }, new Y.Doc());
  current.setEditable(editable);
  return current;
}
