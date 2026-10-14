import { beforeEach, describe, expect, test, vi } from "vitest";
import client from "@/api/client";
import Editor from "@/editor/Editor";
import ChatState from "@/components/chat/ChatState";
import { uploadMedia } from "@/utils/media";
import { generateImage, submitPrompt } from "@/utils/ai";
import type { ChatReference } from "@/components/chat/types";

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

vi.mock("@/editor/Editor", () => ({
  default: { current: null },
}));

const writeMutate = vi.mocked(client.ai.write.mutate);
const generateImageMutate = vi.mocked(client.ai.generateImage.mutate);
const upload = vi.mocked(uploadMedia);

type WriteEvent =
  Awaited<ReturnType<typeof writeMutate>> extends AsyncIterable<infer T> ? T : never;

const REFERENCE: ChatReference = { id: "tile-id", type: "TEXT" };

async function* stream(events: WriteEvent[], error?: Error): AsyncGenerator<WriteEvent> {
  for (const event of events) {
    yield event;
  }
  if (error) {
    throw error;
  }
}

function stubEditor(overrides: { activeSection?: { id: string } | null; referenceIds?: string[] }) {
  const chat = new ChatState();
  const editor = {
    chat,
    pageId: "page-id",
    activeSection: overrides.activeSection ?? null,
    referenceIds: overrides.referenceIds ?? [],
  };
  vi.mocked(Editor).current = editor as unknown as Editor;
  return chat;
}

describe("ai", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  describe("submitPrompt", () => {
    test("sends the prompt with page, section and reference context", async () => {
      const chat = stubEditor({ activeSection: { id: "section-id" }, referenceIds: ["a", "b"] });
      writeMutate.mockResolvedValue(stream([]));

      await submitPrompt("Write something");

      expect(writeMutate).toHaveBeenCalledExactlyOnceWith(
        {
          pageId: "page-id",
          sectionId: "section-id",
          prompt: "Write something",
          context: { tileIds: ["a", "b"] },
          history: undefined,
        },
        { context: { stream: true } },
      );
      expect(chat.messages.value).toMatchObject([{ role: "user", content: "Write something" }]);
    });

    test("sends a null section id when there is no active section", async () => {
      stubEditor({});
      writeMutate.mockResolvedValue(stream([]));

      await submitPrompt("Hi");

      expect(writeMutate.mock.calls[0]?.[0]).toMatchObject({ sectionId: null });
    });

    test("includes the history only when there are earlier messages", async () => {
      const chat = stubEditor({});
      chat.addUserMessage("Earlier");
      writeMutate.mockResolvedValue(stream([]));

      await submitPrompt("Later");

      expect(writeMutate.mock.calls[0]?.[0]).toMatchObject({
        prompt: "Later",
        history: [{ role: "user", content: "Earlier" }],
      });
    });

    test("routes message events to append and reference events to addReference", async () => {
      const chat = stubEditor({});
      const append = vi.spyOn(chat, "append");
      const addReference = vi.spyOn(chat, "addReference");
      const beginStreaming = vi.spyOn(chat, "beginStreaming");
      writeMutate.mockResolvedValue(
        stream([
          { message: "Hello" },
          { message: { type: "paragraph" } },
          { message: { bold: true } },
          { reference: REFERENCE },
        ]),
      );

      await submitPrompt("Hi");

      expect(beginStreaming).toHaveBeenCalledTimes(1);
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
      const chat = stubEditor({});
      const completeStreaming = vi.spyOn(chat, "completeStreaming");
      writeMutate.mockResolvedValue(stream([{ message: "partial" }], new Error("boom")));

      await expect(submitPrompt("Hi")).rejects.toThrow("boom");

      expect(completeStreaming).toHaveBeenCalledTimes(1);
      expect(chat.state.value).toBe("idle");
    });

    test("does not begin streaming when the request fails", async () => {
      const chat = stubEditor({});
      const beginStreaming = vi.spyOn(chat, "beginStreaming");
      writeMutate.mockRejectedValue(new Error("network"));

      await expect(submitPrompt("Hi")).rejects.toThrow("network");

      expect(beginStreaming).not.toHaveBeenCalled();
      expect(chat.messages.value).toMatchObject([{ role: "user", content: "Hi" }]);
    });
  });

  describe("generateImage", () => {
    test("uploads the decoded image as a content file", async () => {
      const bytes = new Uint8Array([1, 2, 3]);
      const data = btoa(String.fromCharCode(...bytes));
      generateImageMutate.mockResolvedValue({ data, type: "image/png" });
      const fetchMock = vi.fn().mockResolvedValue({
        blob: () => Promise.resolve(new Blob([bytes], { type: "image/png" })),
      });
      vi.stubGlobal("fetch", fetchMock);
      const uploaded = { id: "image-id", width: 1, height: 1 };
      upload.mockResolvedValue(uploaded);

      const result = await generateImage("A cat", "workspace-id");

      expect(result).toBe(uploaded);
      expect(generateImageMutate).toHaveBeenCalledExactlyOnceWith({ prompt: "A cat" });
      expect(fetchMock).toHaveBeenCalledExactlyOnceWith(`data:image/png;base64,${data}`);
      expect(upload).toHaveBeenCalledExactlyOnceWith({
        file: expect.any(File),
        purpose: "content",
        workspaceId: "workspace-id",
      });
      const file = upload.mock.calls[0]?.[0].file;
      expect(file?.name).toBe("generated-image.png");
      expect(file?.type).toBe("image/png");
      expect(new Uint8Array((await file?.arrayBuffer()) ?? [])).toEqual(bytes);
    });
  });
});
