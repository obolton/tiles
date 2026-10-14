import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import * as Y from "yjs";
import client from "@/api/client";
import Editor from "@/editor/Editor";
import Section from "@/models/Section";
import { uploadMedia } from "@/utils/media";
import { generateImage, submitPrompt } from "@/utils/ai";
import { PAGE } from "@/test/fixtures/Page";
import type { WriteEvent } from "api/routes/ai/ai";

vi.mock("@/api/client", () => ({
  default: {
    ai: {
      write: { mutate: vi.fn() },
      generateImage: { mutate: vi.fn() },
    },
  },
}));

vi.mock("@/utils/media", () => ({
  uploadMedia: vi.fn(),
}));

const REFERENCE = { id: "tile-id", type: "TEXT" } as const;

async function* stream(events: WriteEvent[], error?: Error): AsyncGenerator<WriteEvent> {
  yield* events;
  if (error) {
    throw error;
  }
}

describe("ai", () => {
  const editor = Editor.init(PAGE, new Y.Doc());
  const { chat } = editor;
  const writeMock = vi.mocked(client.ai.write.mutate);
  const generateImageMock = vi.mocked(client.ai.generateImage.mutate);
  const uploadMock = vi.mocked(uploadMedia);

  function createSection() {
    return editor.page.createTile(
      Section.createMap({ layout: "GRID", mapStyle: null, columns: null }),
      {},
    );
  }

  beforeEach(() => {
    vi.clearAllMocks();
    editor.clearSelection();
    editor.clearReferences();
    chat.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("submitPrompt", () => {
    test("sends the prompt with the page, active section and references", async () => {
      const section = createSection();
      const a = createSection();
      const b = createSection();
      editor.select([section.id]);
      editor.toggleReference(a.id);
      editor.toggleReference(b.id);
      writeMock.mockResolvedValue(stream([]));

      await submitPrompt("Write something");

      expect(writeMock).toHaveBeenCalledExactlyOnceWith(
        {
          pageId: PAGE.id,
          sectionId: section.id,
          prompt: "Write something",
          context: { tileIds: [a.id, b.id] },
          history: undefined,
        },
        { context: { stream: true } },
      );
      expect(chat.messages.value).toMatchObject([{ role: "user", content: "Write something" }]);
    });

    test("sends a null section id when nothing is selected", async () => {
      writeMock.mockResolvedValue(stream([]));

      await submitPrompt("Hi");

      expect(writeMock).toHaveBeenCalledWith(
        expect.objectContaining({ sectionId: null, context: { tileIds: [] } }),
        expect.anything(),
      );
    });

    test("includes the history when there are earlier messages", async () => {
      chat.addUserMessage("Earlier");
      writeMock.mockResolvedValue(stream([]));

      await submitPrompt("Later");

      expect(writeMock).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: "Later",
          history: [{ role: "user", content: "Earlier" }],
        }),
        expect.anything(),
      );
    });

    test("routes message events to append and reference events to addReference", async () => {
      const append = vi.spyOn(chat, "append");
      const addReference = vi.spyOn(chat, "addReference");
      writeMock.mockResolvedValue(
        stream([
          { message: "Hello" },
          { message: { type: "paragraph" } },
          { message: { bold: true } },
          { reference: REFERENCE },
        ]),
      );

      await submitPrompt("Hi");

      expect(append.mock.calls).toEqual([["Hello"], [{ type: "paragraph" }], [{ bold: true }]]);
      expect(addReference).toHaveBeenCalledExactlyOnceWith(REFERENCE);
      expect(chat.state.value).toBe("idle");
      expect(chat.messages.value).toMatchObject([
        { role: "user", content: "Hi" },
        { role: "assistant", references: [REFERENCE] },
        { role: "assistant" },
      ]);
    });

    test("completes streaming even when the stream throws", async () => {
      const completeStreaming = vi.spyOn(chat, "completeStreaming");
      writeMock.mockResolvedValue(stream([{ message: "partial" }], new Error("boom")));

      await expect(submitPrompt("Hi")).rejects.toThrow("boom");

      expect(completeStreaming).toHaveBeenCalledTimes(1);
      expect(chat.state.value).toBe("idle");
    });

    test("does not begin streaming when the request fails", async () => {
      const beginStreaming = vi.spyOn(chat, "beginStreaming");
      writeMock.mockRejectedValue(new Error("network"));

      await expect(submitPrompt("Hi")).rejects.toThrow("network");

      expect(beginStreaming).not.toHaveBeenCalled();
      expect(chat.messages.value).toMatchObject([{ role: "user", content: "Hi" }]);
    });
  });

  describe("generateImage", () => {
    test("uploads the decoded image as a content file", async () => {
      const data = btoa("image-bytes");
      generateImageMock.mockResolvedValue({ data, type: "image/png" });
      const fetchMock = vi.fn().mockResolvedValue({
        blob: () => Promise.resolve(new Blob(["image-bytes"], { type: "image/png" })),
      });
      vi.stubGlobal("fetch", fetchMock);
      const uploaded = { id: "image-id", width: 1, height: 1 };
      uploadMock.mockResolvedValue(uploaded);

      const result = await generateImage("A cat", "workspace-id");

      expect(result).toBe(uploaded);
      expect(generateImageMock).toHaveBeenCalledExactlyOnceWith({ prompt: "A cat" });
      expect(fetchMock).toHaveBeenCalledExactlyOnceWith(`data:image/png;base64,${data}`);
      expect(uploadMock).toHaveBeenCalledExactlyOnceWith({
        file: expect.any(File),
        purpose: "content",
        workspaceId: "workspace-id",
      });
      const file = uploadMock.mock.lastCall?.[0].file;
      expect(file?.name).toBe("generated-image.png");
      expect(file?.type).toBe("image/png");
      expect(await file?.text()).toBe("image-bytes");
    });
  });
});
