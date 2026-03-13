import { EditorView } from "@codemirror/view";
import { syntaxHighlighting } from "@codemirror/language";
import { classHighlighter } from "@lezer/highlight";

export const editorTheme = EditorView.theme({
  "&": {
    fontSize: "inherit",
  },
  ".cm-content": {
    padding: 0,
    caretColor: "currentColor",
  },
  ".cm-line": {
    padding: 0,
  },
  "&.cm-focused .cm-cursor": {
    borderLeftColor: "currentColor",
  },
  "&.cm-focused .cm-selectionBackground, ::selection": {
    backgroundColor: "rgb(0 0 0 / 15%)",
  },
  ".cm-selectionBackground": {
    backgroundColor: "rgb(0 0 0 / 10%)",
  },
  ".cm-gutters": {
    display: "none",
  },
  "&.cm-focused": {
    outline: "none",
  },
  ".cm-scroller": {
    overflow: "auto",
    fontFamily: 'var(--code-font, "JetBrains Mono", monospace)',
    lineHeight: "inherit",
  },
});

export const highlightingExtension = syntaxHighlighting(classHighlighter);
