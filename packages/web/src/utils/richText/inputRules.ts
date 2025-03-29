import {
  inputRules,
  wrappingInputRule,
  textblockTypeInputRule,
} from "prosemirror-inputrules";
import { schema } from "./schema";

function quoteInputRule() {
  return wrappingInputRule(/^\s*>\s$/, schema.nodes.quote);
}

function headingInputRule() {
  return textblockTypeInputRule(
    /^(#{1,3})\s$/,
    schema.nodes.heading,
    (match) => ({ level: match[1]?.length ?? 1 }),
  );
}

function orderedListInputRule() {
  return wrappingInputRule(
    /^\s*(\d+)[.)]\s$/,
    schema.nodes.ordered_list,
    (match) => ({ order: match[1] }),
  );
}

function unorderedListInputRule() {
  return wrappingInputRule(/^\s*[-+*]\s$/, schema.nodes.unordered_list);
}

export function createInputRules() {
  return inputRules({
    rules: [
      quoteInputRule(),
      headingInputRule(),
      orderedListInputRule(),
      unorderedListInputRule(),
    ],
  });
}
