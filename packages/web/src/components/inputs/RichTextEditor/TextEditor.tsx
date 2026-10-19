import "prosemirror-view/style/prosemirror.css";
import "prosemirror-gapcursor/style/gapcursor.css";
import { EditorView } from "prosemirror-view";
import { EditorState } from "prosemirror-state";
import { createState } from "@/utils/richText/state";
import { handleError } from "@/utils/errors";
import type { RichText } from "doc/types/richText";
import type { JSX } from "jsx/jsx";
import type { Reactive } from "reactivity";

export type { EditorState };

export interface TextEditorProps extends JSX.Attributes<"div"> {
  editorView: Reactive<EditorView | null>;
  state: Reactive<EditorState | null>;
  initialValue?: RichText | null;
  onChange?: (state: EditorState) => void;
  signal?: AbortSignal;
}

export default function TextEditor({
  editorView,
  state,
  classList,
  initialValue = null,
  onChange,
  signal,
  ...props
}: TextEditorProps) {
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
      if (!state.value) {
        state.value = createState(initialValue);
      }
      const view = new EditorView(
        { mount: element },
        {
          state: state.value,
          dispatchTransaction(tr) {
            const newState = view.state.apply(tr);
            view.updateState(newState);
            state.value = newState;
            onChange?.(newState);
          },
        },
      );

      // Apply external state changes
      state.subscribe(() => {
        const newState = state.value;
        if (newState && newState !== view.state) {
          view.updateState(newState);
        }
      }, signal);
      editorView.value = view;
    } catch (error) {
      handleError(error);
    }
  };

  return <div {...props} ref={ref} classList={classList} role="textbox" />;
}
