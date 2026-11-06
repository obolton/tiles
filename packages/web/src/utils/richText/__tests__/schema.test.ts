import { describe, expect, test } from "vitest";
import { DOMParser, DOMSerializer } from "prosemirror-model";
import { MIN_TEXT_SIZE, MAX_TEXT_SIZE } from "@/constants/formatting";
import { schema } from "../schema";

const tile = () => schema.nodes.tile.create({ id: "tile-1" });
const paragraph = () => schema.nodes.paragraph.create(null, [schema.text("p")]);

describe("schema", () => {
  describe("size mark", () => {
    test.each([MIN_TEXT_SIZE, 1, 1.25, MAX_TEXT_SIZE])("accepts size %s", (size) => {
      expect(schema.marks.size.create({ size }).attrs.size).toBe(size);
    });

    test.each([MIN_TEXT_SIZE - 0.1, MAX_TEXT_SIZE + 0.1, Number.NaN, "1", null])(
      "rejects size %s",
      (size) => {
        expect(() => schema.marks.size.create({ size })).toThrow(RangeError);
      },
    );
  });

  describe("tile node", () => {
    test("requires a string id", () => {
      expect(tile().attrs.id).toBe("tile-1");
      expect(() => schema.nodes.tile.create({ id: 1 })).toThrow(RangeError);
      expect(() => schema.nodes.tile.create({})).toThrow(RangeError);
    });

    test("is a selectable atom block", () => {
      expect(tile().isAtom).toBe(true);
      expect(tile().isBlock).toBe(true);
      expect(schema.nodes.tile.spec.selectable).toBe(true);
    });

    test.each([
      ["doc", () => schema.nodes.doc.create(null, [tile()])],
      ["list item", () => schema.nodes.list_item.create(null, [paragraph(), tile()])],
      ["quote", () => schema.nodes.quote.create(null, [tile()])],
      ["pending block", () => schema.nodes.pending.create(null, [tile()])],
    ])("is allowed in a %s", (_name, create) => {
      expect(() => create().check()).not.toThrow();
    });

    test("is not allowed inside a paragraph", () => {
      expect(() => schema.nodes.paragraph.create(null, [tile()]).check()).toThrow(RangeError);
    });

    test("round-trips through the DOM", () => {
      const doc = schema.nodes.doc.create(null, [tile()]);
      const dom = DOMSerializer.fromSchema(schema).serializeFragment(doc.content);
      expect(dom.firstElementChild?.outerHTML).toBe('<div data-tile="tile-1"></div>');

      const parsed = DOMParser.fromSchema(schema).parse(dom);
      expect(parsed.eq(doc)).toBe(true);
    });
  });
});
