import { describe, expect, test } from "vitest";
import { MENTION_PLUGIN_KEY, mentions } from "../mentions";
import { createState, doc, p } from "./builders";

function open(pos: number) {
  const initial = createState(doc(p("Hello")), 3, [mentions()]);
  return initial.apply(initial.tr.setMeta(MENTION_PLUGIN_KEY, { pos }));
}

describe("mentions plugin state", () => {
  test("starts closed", () => {
    expect(MENTION_PLUGIN_KEY.getState(createState(doc(p("Hello")), 3, [mentions()]))).toBeNull();
  });

  test("opens a picker widget at the requested position", () => {
    const decorations = MENTION_PLUGIN_KEY.getState(open(2))?.find() ?? [];
    expect(decorations).toHaveLength(1);
    expect(decorations[0]?.from).toBe(2);
    expect(decorations[0]?.to).toBe(2);
  });

  test("maps the widget through document changes", () => {
    const opened = open(2);
    const moved = opened.apply(opened.tr.insertText("Oh ", 1));
    const decorations = MENTION_PLUGIN_KEY.getState(moved)?.find() ?? [];
    expect(decorations).toHaveLength(1);
    expect(decorations[0]?.from).toBe(5);
  });

  test("closes when the position is null", () => {
    const opened = open(2);
    const closed = opened.apply(opened.tr.setMeta(MENTION_PLUGIN_KEY, { pos: null }));
    expect(MENTION_PLUGIN_KEY.getState(closed)).toBeNull();
  });

  test("stays closed through unrelated transactions", () => {
    const initial = createState(doc(p("Hello")), 3, [mentions()]);
    expect(MENTION_PLUGIN_KEY.getState(initial.apply(initial.tr.insertText("!")))).toBeNull();
  });
});
