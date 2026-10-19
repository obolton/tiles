import "prosemirror-view/style/prosemirror.css";
import "prosemirror-gapcursor/style/gapcursor.css";
import "./CollaborativeTextEditor.css";
import { EditorView } from "prosemirror-view";
import { Plugin } from "prosemirror-state";
import { keymap } from "prosemirror-keymap";
import { ySyncPlugin, yCursorPlugin, undo, redo } from "y-prosemirror";
import { createUndoPlugin } from "@/utils/richText/undoPlugin";
import { createState } from "@/utils/richText/state";
import { handleError } from "@/utils/errors";
import type * as Y from "yjs";
import type { EditorState } from "prosemirror-state";
import type { Awareness } from "@/collaboration/types";
import type { JSX } from "@/jsx/jsx";
import type { Reactive } from "reactivity";

export interface CollaborativeTextEditorProps extends JSX.Attributes<"div"> {
  contentFragment: Y.XmlFragment;
  awareness: Awareness;
  undoManager?: Y.UndoManager;
  editorView: Reactive<EditorView | null>;
  onChange?: (state: EditorState) => void;
  signal?: AbortSignal;
}

export default function CollaborativeTextEditor({
  contentFragment,
  awareness,
  undoManager,
  editorView,
  classList,
  onChange,
  signal,
  ...props
}: CollaborativeTextEditorProps) {
  signal?.addEventListener(
    "abort",
    () =>
      requestAnimationFrame(() => {
        editorView.value?.destroy();
        editorView.value = null;
      }),
    { once: true },
  );

  const ref = (element: HTMLElement) => {
    try {
      const onChangePlugin = new Plugin({
        view() {
          return {
            update(view, prevState) {
              if (view.state !== prevState) {
                onChange?.(view.state);
              }
            },
          };
        },
      });
      const initialState = createState(null, [
        ySyncPlugin(contentFragment),
        yCursorPlugin(awareness),
        createUndoPlugin(undoManager),
        keymap({
          "Mod-z": undo,
          "Mod-y": redo,
          "Mod-Shift-z": redo,
        }),
        onChangePlugin,
      ]);
      const view = new EditorView({ mount: element }, { state: initialState });
      onChange?.(view.state);
      editorView.value = view;
    } catch (error) {
      handleError(error);
    }
  };

  return <div {...props} ref={ref} classList={classList} role="textbox" />;
}
