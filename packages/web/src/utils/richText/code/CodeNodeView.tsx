import { EditorView as CMEditorView, keymap, lineNumbers as cmLineNumbers } from "@codemirror/view";
import { EditorState, Compartment } from "@codemirror/state";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { loadLanguage } from "./languages";
import { editorTheme, highlightingExtension } from "./theme";
import { forwardToProseMirror, applyToCodeMirror } from "./sync";
import { createEscapeCommand, insertParagraphAfter, deleteCodeBlockIfEmpty } from "./navigation";
import { handleError } from "@/utils/errors";
import styles from "./code.module.css";
import "./highlight.css";
import type { NodeView, EditorView } from "prosemirror-view";
import type { Node } from "prosemirror-model";

export class CodeNodeView implements NodeView {
  readonly dom: HTMLElement;

  private readonly view: EditorView;
  private readonly getPos: () => number | undefined;
  private readonly cm: CMEditorView;
  private readonly languageCompartment = new Compartment();
  private readonly lineNumbersCompartment = new Compartment();
  private readonly editableCompartment = new Compartment();

  private updating = false;
  private language: string;
  private lineNumbers: boolean;

  constructor(node: Node, view: EditorView, getPos: () => number | undefined) {
    this.view = view;
    this.getPos = getPos;
    this.language = node.attrs.language as string;
    this.lineNumbers = node.attrs.lineNumbers as boolean;

    this.dom = document.createElement("pre");

    // CodeMirror container
    const container = document.createElement("code");
    container.className = styles["editor-container"];
    this.dom.appendChild(container);

    this.cm = new CMEditorView({
      state: EditorState.create({
        doc: node.textContent,
        extensions: [
          keymap.of(this.createKeymap()),
          keymap.of(defaultKeymap),
          history(),
          keymap.of(historyKeymap),
          editorTheme,
          highlightingExtension,
          this.languageCompartment.of([]),
          this.lineNumbersCompartment.of(this.lineNumbers ? cmLineNumbers() : []),
          CMEditorView.updateListener.of((update) => {
            if (!this.updating) {
              forwardToProseMirror(update, this.view, this.getPos);
            }
          }),
          this.editableCompartment.of(CMEditorView.editable.of(view.editable)),
        ],
      }),
      parent: container,
    });

    this.loadLanguageExtension(this.language);
  }

  private createKeymap() {
    return [
      {
        key: "ArrowUp",
        run: createEscapeCommand(this.view, this.getPos, "line", -1),
      },
      {
        key: "ArrowLeft",
        run: createEscapeCommand(this.view, this.getPos, "char", -1),
      },
      {
        key: "ArrowDown",
        run: createEscapeCommand(this.view, this.getPos, "line", 1),
      },
      {
        key: "ArrowRight",
        run: createEscapeCommand(this.view, this.getPos, "char", 1),
      },
      {
        key: "Ctrl-Enter",
        mac: "Cmd-Enter",
        run: () => {
          const pos = this.getPos();
          return typeof pos === "number" && insertParagraphAfter(this.view, pos);
        },
      },
      {
        key: "Backspace",
        run: () => {
          const pos = this.getPos();
          return typeof pos === "number" && deleteCodeBlockIfEmpty(this.cm, this.view, pos);
        },
      },
    ];
  }

  private async loadLanguageExtension(language: string) {
    try {
      const support = await loadLanguage(language);
      this.cm.dispatch({
        effects: this.languageCompartment.reconfigure(support ?? []),
      });
    } catch (error) {
      handleError(error);
    }
  }

  update(node: Node): boolean {
    if (node.type.name !== "codeBlock") {
      return false;
    }

    const newLanguage = node.attrs.language as string;
    if (newLanguage !== this.language) {
      this.language = newLanguage;
      this.loadLanguageExtension(newLanguage);
    }

    const newLineNumbers = node.attrs.lineNumbers as boolean;
    if (newLineNumbers !== this.lineNumbers) {
      this.lineNumbers = newLineNumbers;
      this.cm.dispatch({
        effects: this.lineNumbersCompartment.reconfigure(newLineNumbers ? cmLineNumbers() : []),
      });
    }

    // Sync editable state
    this.cm.dispatch({
      effects: this.editableCompartment.reconfigure(CMEditorView.editable.of(this.view.editable)),
    });

    // Sync content from ProseMirror (e.g., undo/redo)
    this.updating = true;
    applyToCodeMirror(this.cm, node.textContent);
    this.updating = false;

    return true;
  }

  selectNode() {
    this.cm.focus();
  }

  setSelection(anchor: number, head: number) {
    this.cm.dispatch({ selection: { anchor, head } });
    this.cm.focus();
  }

  stopEvent() {
    return true;
  }

  ignoreMutation() {
    return true;
  }

  destroy() {
    this.cm.destroy();
  }
}
