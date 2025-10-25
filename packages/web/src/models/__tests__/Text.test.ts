import { afterEach, describe, expect, test, vi } from "vitest";
import Text from "@/models/Text";
import Editor from "@/editor/Editor";
import client from "@/api/client";
import { createState } from "@/utils/richText/state";
import { PAGE } from "@/test/fixtures/Page";
import { TEXT_TILE } from "@/test/fixtures/Tile";
import type {
  Background,
  BackgroundUpdate,
} from "@/components/backgrounds/types";
import type { Color } from "@/utils/color";

vi.mock("@/api/client", () => ({
  default: {
    text: {
      update: {
        mutate: vi.fn(),
      },
    },
  },
}));

describe("Text", () => {
  const editor = Editor.init(PAGE);
  const textUpdateMock = vi.mocked(client.text.update.mutate);

  afterEach(() => {
    textUpdateMock.mockReset();
  });

  test("maps properties to reactive values", () => {
    const text = new Text(editor, TEXT_TILE);

    expect(text.content.value).toEqual(TEXT_TILE.content);
    expect(text.align.value).toBe(TEXT_TILE.align);
    expect(text.textColor.value).toBe(TEXT_TILE.textColor);
    expect(text.background.value).toBe(TEXT_TILE.background);
    expect(text.state.value).toBeNull();
  });

  test("updates vertical alignment and persists the change", async () => {
    const text = new Text(editor, TEXT_TILE);
    const align = "CENTER";

    await text.setVerticalAlignment(align);

    expect(text.align.value).toBe(align);
    expect(textUpdateMock).toHaveBeenCalledWith({
      pageId: PAGE.id,
      id: TEXT_TILE.id,
      align,
    });
  });

  test("updates text color and persists the change", async () => {
    const text = new Text(editor, TEXT_TILE);
    const textColor: Color = "ffff00000000";

    await text.setTextColor(textColor);

    expect(text.textColor.value).toBe(textColor);
    expect(textUpdateMock).toHaveBeenCalledWith({
      pageId: PAGE.id,
      id: TEXT_TILE.id,
      textColor,
    });
  });

  test("applies background updates and stores the returned background", async () => {
    const text = new Text(editor, TEXT_TILE);
    const colorA: Color = "ffff00000000";
    const colorB: Color = "888800000000";
    const backgroundUpdate: BackgroundUpdate = { type: "color", color: colorA };
    const background: Background = {
      type: "gradient",
      colorA,
      colorB,
      direction: "VERTICAL",
    };

    textUpdateMock.mockResolvedValue({
      ...TEXT_TILE,
      background,
    });

    await text.setBackground(backgroundUpdate);

    expect(textUpdateMock).toHaveBeenCalledWith({
      pageId: PAGE.id,
      id: TEXT_TILE.id,
      background: backgroundUpdate,
    });
    expect(text.background.value).toEqual(background);
  });

  test("does not persist when no editor state is set", () => {
    const text = new Text(editor, TEXT_TILE);

    const result = text.persist();

    expect(result).toBeUndefined();
    expect(textUpdateMock).not.toHaveBeenCalled();
  });

  test("serializes the current state before persisting", async () => {
    const text = new Text(editor, TEXT_TILE);

    text.state.value = createState(TEXT_TILE.content);

    await text.persist();

    expect(text.content.value).toEqual(TEXT_TILE.content);
    expect(textUpdateMock).toHaveBeenCalledWith({
      pageId: PAGE.id,
      id: TEXT_TILE.id,
      content: TEXT_TILE.content,
    });
  });
});
