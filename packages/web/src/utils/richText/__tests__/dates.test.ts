import { describe, test, expect } from "vitest";
import { schema } from "../schema";
import { serialize } from "../serialize";
import { deserialize } from "../deserialize";
import { EditorState } from "prosemirror-state";

function createState(value: string, time: boolean) {
  const dateNode = schema.nodes.date.create({ value, time });
  const paragraph = schema.nodes.paragraph.create(null, dateNode);
  const doc = schema.nodes.doc.create(null, paragraph);
  return EditorState.create({ doc });
}

describe("date node", () => {
  test("preserves a full ISO string when time is true", () => {
    const date = "2026-01-01T12:00:00.000Z";
    expect(serialize(createState(date, true))).toMatchObject([
      { type: "paragraph", children: [{ type: "date", value: date }] },
    ]);
  });

  test("emits date-only string when time is false", () => {
    expect(serialize(createState("2026-01-01T12:00:00.000Z", false))).toMatchObject([
      {
        type: "paragraph",
        children: [{ type: "date", value: "2026-01-01" }],
      },
    ]);
  });

  test("round-trips a date-time through serialize and deserialize", () => {
    const date = "2026-01-01T12:00:00.000Z";
    const after = deserialize(serialize(createState(date, true)));
    const dateNode = after.firstChild?.firstChild;
    expect(dateNode?.attrs).toMatchObject({ value: date, time: true });
  });

  test("round-trips a date-only through serialize and deserialize", () => {
    const after = deserialize(serialize(createState("2026-01-01T12:00:00.000Z", false)));
    const dateNode = after.firstChild?.firstChild;
    expect(dateNode?.attrs).toMatchObject({
      value: "2026-01-01",
      time: false,
    });
  });
});
