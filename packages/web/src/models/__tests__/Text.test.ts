import { describe, expect, test } from "vitest";
import * as Y from "yjs";
import Text, { type CreateTextInput } from "@/models/Text";
import Editor from "@/editor/Editor";
import { PAGE } from "@/test/fixtures/Page";

const TEXT_PROPS: Omit<CreateTextInput, "parentId" | "beforeId"> = {
  align: "TOP",
};

describe("Text", () => {
  const editor = Editor.init(PAGE, new Y.Doc());

  function createText(overrides: Partial<CreateTextInput> = {}): Text {
    return editor.page.createTile(Text.createMap({ ...TEXT_PROPS, ...overrides }), {}) as Text;
  }

  test("maps properties to reactive values", () => {
    const text = createText();

    expect(text.align.value).toBe(TEXT_PROPS.align);
    expect(text.contentFragment).toBeInstanceOf(Y.XmlFragment);
  });
});
