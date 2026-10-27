import { beforeEach, describe, expect, test, vi } from "vitest";
import { simulateReadableStream } from "ai";
import * as Y from "yjs";
import { buildTextMap } from "doc/tiles/text";
import { createToolContext, getTile } from "@/test/fixtures/ai";
import { streamTurn, type ModelInput, type WriteEvent } from "../ai";
import type { ToolContext } from "@/ai/tools/types";

const { doStream } = vi.hoisted(() => ({ doStream: vi.fn() }));

vi.mock("@/ai/models", async () => {
  const { MockLanguageModelV4 } = await import("ai/test");
  return { TEXT_MODEL: new MockLanguageModelV4({ doStream }) };
});

const USAGE = {
  inputTokens: { total: 1, noCache: 1, cacheRead: undefined, cacheWrite: undefined },
  outputTokens: { total: 1, text: 1, reasoning: undefined },
};

const INPUT: ModelInput = {
  instructions: "Be helpful.",
  messages: [{ role: "user", content: "Hello" }],
};

const CREATE_TEXT_ARGS = { parentId: null, align: null, size: "medium", coordinates: null };

function textChunks(text: string) {
  return [
    { type: "text-start", id: "text-1" },
    { type: "text-delta", id: "text-1", delta: text },
    { type: "text-end", id: "text-1" },
  ];
}

function finishChunk(finishReason: "stop" | "tool-calls") {
  return { type: "finish", finishReason: { unified: finishReason, raw: undefined }, usage: USAGE };
}

function mockStream(chunks: unknown[]) {
  doStream.mockResolvedValue({ stream: simulateReadableStream({ chunks }) });
}

async function collect(events: AsyncIterable<WriteEvent>) {
  const collected: WriteEvent[] = [];
  for await (const event of events) {
    collected.push(event);
  }
  return collected;
}

describe("streamTurn", () => {
  let doc: Y.Doc;
  let context: ToolContext;

  beforeEach(() => {
    ({ doc, context } = createToolContext());
  });

  test("streams model text as message events", async () => {
    mockStream([...textChunks("Hello world"), finishChunk("stop")]);

    const { events, hasToolCalls } = streamTurn(INPUT, context, [], null);

    expect(await collect(events())).toEqual([{ message: "Hello world" }]);
    expect(hasToolCalls()).toBe(false);
  });

  test("sends the instructions and messages to the model", async () => {
    mockStream([...textChunks("Hi"), finishChunk("stop")]);

    const { events } = streamTurn(INPUT, context, [], null);
    await collect(events());

    expect(doStream).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: [
          expect.objectContaining({ role: "system", content: "Be helpful." }),
          expect.objectContaining({ role: "user", content: [{ type: "text", text: "Hello" }] }),
        ],
      }),
    );
  });

  test("writes block content into the destination tile", async () => {
    const tileId = context.session.createTile(
      buildTextMap({ width: 12, height: 10, coordinates: null }),
    );
    mockStream([...textChunks(">>> 0\nBlock text\n<<<\nDone"), finishChunk("stop")]);

    const { events } = streamTurn(
      INPUT,
      { ...context, resolveArtifactId: () => tileId },
      [tileId],
      null,
    );

    expect(await collect(events())).toEqual([{ message: "Done" }]);
    expect(String(getTile(doc, tileId).get("content"))).toContain("Block text");
  });

  test("executes tool calls and yields references after the message", async () => {
    const artifactIds: string[] = [];
    mockStream([
      ...textChunks("Creating a block"),
      {
        type: "tool-call",
        toolCallId: "call-1",
        toolName: "create_text",
        input: JSON.stringify(CREATE_TEXT_ARGS),
      },
      finishChunk("tool-calls"),
    ]);

    const { events, hasToolCalls, responseMessages } = streamTurn(
      INPUT,
      context,
      artifactIds,
      null,
    );
    const collected = await collect(events());

    expect(artifactIds).toEqual([expect.any(String)]);
    expect(collected).toEqual([
      { message: "Creating a block" },
      { reference: { id: artifactIds[0], type: "TEXT" } },
    ]);
    expect(hasToolCalls()).toBe(true);
    expect(await responseMessages()).toEqual([
      expect.objectContaining({ role: "assistant" }),
      {
        role: "tool",
        content: [
          expect.objectContaining({
            type: "tool-result",
            toolCallId: "call-1",
            toolName: "create_text",
            output: { type: "json", value: { id: "0" } },
          }),
        ],
      },
    ]);
  });

  test("ends the turn cleanly when aborted mid-stream", async () => {
    const controller = new AbortController();
    doStream.mockResolvedValue({
      stream: simulateReadableStream({
        chunks: [...textChunks("Hello"), finishChunk("stop")],
        chunkDelayInMs: 20,
      }),
    });

    const { events, hasToolCalls } = streamTurn(INPUT, context, [], null, controller.signal);
    const collected: WriteEvent[] = [];
    for await (const event of events()) {
      collected.push(event);
      controller.abort();
    }

    expect(collected).toEqual([{ message: "Hello" }]);
    expect(hasToolCalls()).toBe(false);
  });

  test("rejects when the stream reports an error", async () => {
    mockStream([{ type: "error", error: new Error("boom") }]);

    const { events } = streamTurn(INPUT, context, [], null);

    await expect(collect(events())).rejects.toThrow("boom");
  });
});
