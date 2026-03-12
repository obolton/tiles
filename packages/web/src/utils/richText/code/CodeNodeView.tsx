import { EditorView as CMEditorView, keymap } from "@codemirror/view";
import { EditorState, Compartment } from "@codemirror/state";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { render } from "@/jsx/dom";
import ListOption from "@/components/lists/ListOption";
import ListGroup from "@/components/lists/ListGroup";
import CodeIcon from "@/icons/code.svg?jsx";
import type ListSelect from "@/elements/list-select/ListSelect";
import {
  loadLanguage,
  findLanguageConfig,
  SUPPORTED_LANGUAGES,
} from "./languages";
import { editorTheme, highlightingExtension } from "./theme";
import { forwardToProseMirror, applyToCodeMirror } from "./sync";
import {
  createEscapeCommand,
  insertParagraphAfter,
  deleteCodeBlockIfEmpty,
} from "./navigation";
import { handleError } from "@/utils/errors";
import styles from "./code.module.css";
import "./highlight.css";
import type { NodeView, EditorView } from "prosemirror-view";
import type { Node } from "prosemirror-model";

export class CodeNodeView implements NodeView, EventListenerObject {
  readonly dom: HTMLElement;

  private readonly view: EditorView;
  private readonly getPos: () => number | undefined;
  private readonly cm: CMEditorView;
  private readonly languageCompartment = new Compartment();
  private readonly editableCompartment = new Compartment();
  private readonly selector: HTMLElement;

  private updating = false;
  private language: string;

  constructor(node: Node, view: EditorView, getPos: () => number | undefined) {
    this.view = view;
    this.getPos = getPos;
    this.language = node.attrs.language as string;

    this.dom = document.createElement("pre");
    this.dom.className = styles["code-block"];

    // Language selector
    this.selector = this.createLanguageSelector();
    this.selector.addEventListener("change", this);
    this.dom.appendChild(this.selector);

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

  private createLanguageSelector(): HTMLElement {
    const config = findLanguageConfig(this.language);

    return render(
      <list-select
        className={styles["language-selector"]}
        value={config?.id ?? ""}
        orientation="vertical"
        align="right"
        showvalue
        label="Language"
      >
        <CodeIcon slot="default-icon" aria-hidden="true" />
        <ListGroup>
          {SUPPORTED_LANGUAGES.map((language) => (
            <ListOption value={language.id}>{language.name}</ListOption>
          ))}
        </ListGroup>
      </list-select>,
    )[0] as HTMLElement;
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
          return (
            typeof pos === "number" && insertParagraphAfter(this.view, pos)
          );
        },
      },
      {
        key: "Backspace",
        run: () => {
          const pos = this.getPos();
          return (
            typeof pos === "number" &&
            deleteCodeBlockIfEmpty(this.cm, this.view, pos)
          );
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

  handleEvent(event: Event) {
    if (event.type === "change") {
      const target = event.target as ListSelect;
      const pos = this.getPos();
      if (typeof pos === "number") {
        this.view.dispatch(
          this.view.state.tr.setNodeAttribute(
            pos,
            "language",
            target.value ?? "",
          ),
        );
        this.cm.focus();
      }
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
      (this.selector as ListSelect).value =
        findLanguageConfig(newLanguage)?.id ?? "";
    }

    // Sync editable state
    this.cm.dispatch({
      effects: this.editableCompartment.reconfigure(
        CMEditorView.editable.of(this.view.editable),
      ),
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
    this.selector.removeEventListener("change", this);
    this.cm.destroy();
  }
}
