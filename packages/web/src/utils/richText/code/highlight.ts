import { highlightTree, classHighlighter } from "@lezer/highlight";
import { loadLanguage } from "./languages";

export interface HighlightedSpan {
  text: string;
  className: string | null;
}

export async function highlight(code: string, language: string): Promise<HighlightedSpan[]> {
  const languageSupport = await loadLanguage(language);

  if (!languageSupport?.language) {
    return [{ text: code, className: null }];
  }

  const tree = languageSupport.language.parser.parse(code);
  const spans: HighlightedSpan[] = [];
  let pos = 0;

  highlightTree(tree, classHighlighter, (from, to, classes) => {
    // Add unhighlighted text before this span
    if (from > pos) {
      spans.push({ text: code.slice(pos, from), className: null });
    }
    // Add highlighted span
    spans.push({ text: code.slice(from, to), className: classes });
    pos = to;
  });

  // Add remaining unhighlighted text
  if (pos < code.length) {
    spans.push({ text: code.slice(pos), className: null });
  }

  return spans;
}
