import { EditorView } from "prosemirror-view";
import { EditorState } from "prosemirror-state";
import FormattingToolbar from "./FormattingToolbar";
import { createState } from "@/utils/richText/state";
import { handleError } from "@/utils/errors";
import styles from "./TextEditor.module.css";
import { flag } from "@/utils/reactivity";
import If from "@/jsx/if";
import Portal from "@/jsx/portal";
import type { RichText } from "@/utils/richText/types";
import type { Command } from "prosemirror-state";
import type { JSX } from "@/jsx/jsx";
import type { Reactive } from "@/utils/reactivity";

export type { EditorState };

export interface TextEditorProps extends JSX.Attributes<HTMLDivElement> {
  state: Reactive<EditorState | null>;
  initialValue?: RichText | null;
  extraToolbarItems?: JSX.Node;
  onChange?: (state: EditorState) => void;
  signal?: AbortSignal;
}

export default function TextEditor({
  state,
  classList = [],
  initialValue = null,
  extraToolbarItems,
  onChange,
  signal,
  ...props
}: TextEditorProps) {
  let editorView: EditorView | null = null;
  const showToolbar = flag(false);

  signal?.addEventListener(
    "abort",
    () =>
      requestAnimationFrame(() => {
        editorView?.destroy();
        editorView = null;
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
      editorView = view;
    } catch (error) {
      handleError(error);
    }
  };

  const performCommand = (command: Command) => {
    if (editorView) {
      command(editorView.state, editorView.dispatch, editorView);
    }
  };

  function onFocus() {
    showToolbar.on();
  }

  function onBlur() {
    showToolbar.off();
  }

  return (
    <>
      <div
        {...props}
        ref={ref}
        classList={{ "rich-text": true, [styles.editor]: true, ...classList }}
        role="textbox"
        on:focus={onFocus}
        on:blur={onBlur}
      />

      <If condition={showToolbar}>
        <Portal>
          <FormattingToolbar state={state} performCommand={performCommand}>
            {extraToolbarItems}
          </FormattingToolbar>
        </Portal>
      </If>
    </>
  );
}
