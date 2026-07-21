import {
  inputRules,
  wrappingInputRule,
  textblockTypeInputRule,
  InputRule,
} from "prosemirror-inputrules";
import { schema } from "./schema";

function quoteInputRule() {
  return wrappingInputRule(/^\s*>\s$/, schema.nodes.quote);
}

function headingInputRule() {
  return textblockTypeInputRule(
    /^(#{1,3})\s$/,
    schema.nodes.heading,
    (match: RegExpMatchArray) => ({
      level: match[1]?.length ?? 1,
    }),
  );
}

function orderedListInputRule() {
  return wrappingInputRule(
    /^\s*(\d+)[.)]\s$/,
    schema.nodes.ordered_list,
    (match: RegExpMatchArray) => ({
      order: match[1],
    }),
  );
}

function unorderedListInputRule() {
  return wrappingInputRule(/^\s*[-+*]\s$/, schema.nodes.unordered_list);
}

function codeBlockInputRule() {
  return textblockTypeInputRule(/^```$/, schema.nodes.codeBlock);
}

function inlineCodeInputRule() {
  return new InputRule(/(?<=^|[^`])`([^`]+)`$/, (state, match, start, end) => {
    const text = match[1];
    if (!text) {
      return null;
    }
    const code = schema.marks.code.create();
    return state.tr
      .delete(start, end)
      .insertText(text, start)
      .addMark(start, start + text.length, code)
      .removeStoredMark(code);
  });
}

function dividerInputRule() {
  return new InputRule(/^(-{3,}|\*{3,}|_{3,})$/, (state, _match, start, _end) => {
    const $start = state.doc.resolve(start);
    if ($start.parent.type !== schema.nodes.paragraph || $start.parentOffset !== 0) {
      return null;
    }
    return state.tr.replaceWith($start.before(), $start.after(), schema.nodes.divider.create(null));
  });
}

export function createInputRules() {
  return inputRules({
    rules: [
      quoteInputRule(),
      headingInputRule(),
      orderedListInputRule(),
      unorderedListInputRule(),
      dividerInputRule(),
      codeBlockInputRule(),
      inlineCodeInputRule(),
    ],
  });
}
