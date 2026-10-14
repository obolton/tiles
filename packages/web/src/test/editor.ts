import * as Y from "yjs";
import Editor from "@/editor/Editor";
import { setEditMode } from "@/utils/edit";
import { PAGE } from "@/test/fixtures/Page";
import type { PageData } from "@/editor/Editor";

interface CreateEditorOptions {
  /** Merged onto the `PAGE` fixture. */
  page?: Partial<PageData>;
  /** Defaults to editable, which starts the stubbed collaboration session. */
  editable?: boolean;
}

let current: Editor | null = null;

/**
 * Creates an editor on a fresh document. `Editor` is a singleton, so the
 * previously created editor is disposed first; call this in `beforeEach` to
 * give every test its own page.
 */
export function createEditor({ page, editable = true }: CreateEditorOptions = {}): Editor {
  current?.dispose();
  setEditMode(false);
  current = Editor.init({ ...PAGE, ...page }, new Y.Doc());
  current.setEditable(editable);
  return current;
}
