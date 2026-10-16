import { beforeEach, describe, expect, test, vi } from "vitest";
import * as Y from "yjs";
import Text, { type CreateTextInput } from "@/models/Text";
import { createEditor } from "@/test/editor";
import type Editor from "@/editor/Editor";

vi.mock("@/collaboration/PageCollaboration", () => import("@/test/mocks/PageCollaboration"));

const TEXT_PROPS: Omit<CreateTextInput, "parentId" | "beforeId"> = {
  align: "TOP",
};

describe("Text", () => {
  let editor: Editor;

  beforeEach(() => {
    editor = createEditor();
  });

  function createText(overrides: Partial<CreateTextInput> = {}): Text {
    return editor.page.createTile(Text.createMap({ ...TEXT_PROPS, ...overrides }), {}) as Text;
  }

  test("maps properties to reactive values", () => {
    const text = createText();

    expect(text.align.value).toBe(TEXT_PROPS.align);
    expect(text.contentFragment).toBeInstanceOf(Y.XmlFragment);
  });
});
