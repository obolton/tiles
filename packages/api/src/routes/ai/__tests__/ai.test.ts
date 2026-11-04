import { beforeEach, describe, expect, test, vi } from "vitest";
import { simulateReadableStream } from "ai";
import * as Y from "yjs";
import { buildTextMap } from "doc/tiles/text";
import { createToolContext, getTile, MOCK_TOOL_CONTEXT } from "@/test/fixtures/ai";
import { streamTurn, write, type ModelInput, type WriteEvent } from "../ai";
import type { ToolContext } from "@/ai/tools/types";

const { doStream, disconnect } = vi.hoisted(() => ({ doStream: vi.fn(), disconnect: vi.fn() }));

vi.mock("@/ai/models", async () => {
  const { MockLanguageModelV4 } = await import("ai/test");
  return { TEXT_MODEL: new MockLanguageModelV4({ doStream }) };
});

vi.mock("@/collaboration/instance", async () => {
  const Y = await import("yjs");
  return {
    hocuspocus: {
      openDirectConnection: vi.fn(async () => ({ document: new Y.Doc(), disconnect })),
    },
  };
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
const EDIT_STYLE_ARGS = {
  id: 5,
  background: null,
  textColor: null,
  animation: null,
  frame: null,
  hide: null,
  x: null,
  y: null,
  coordinates: null,
};

function textChunks(text: string) {
  return [
    { type: "text-start", id: "text-1" },
    { type: "text-delta", id: "text-1", delta: text },
    { type: "text-end", id: "text-1" },
  ];
}

function toolCallChunk(toolName: string, args: unknown) {
  return { type: "tool-call", toolCallId: "call-1", toolName, input: JSON.stringify(args) };
}

function finishChunk(finishReason: "stop" | "tool-calls" | "length") {
  return { type: "finish", finishReason: { unified: finishReason, raw: undefined }, usage: USAGE };
}

function throwUnknownArtifact(): never {
  throw new Error("Unknown artifact: 5");
}

function streamOf(chunks: unknown[], chunkDelayInMs?: number) {
  return { stream: simulateReadableStream({ chunks, chunkDelayInMs }) };
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
    doStream.mockResolvedValue(streamOf([...textChunks("Hello world"), finishChunk("stop")]));

    const { events, result } = streamTurn(INPUT, context, [], null);

    expect(await collect(events())).toEqual([{ message: "Hello world" }]);
    expect(await result.finishReason).toBe("stop");
  });

  test("sends the instructions and messages to the model", async () => {
    doStream.mockResolvedValue(streamOf([...textChunks("Hi"), finishChunk("stop")]));

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
    doStream.mockResolvedValue(
      streamOf([...textChunks(">>> 0\nBlock text\n<<<\nDone"), finishChunk("stop")]),
    );

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
    doStream.mockResolvedValue(
      streamOf([
        ...textChunks("Creating a block"),
        toolCallChunk("create_text", CREATE_TEXT_ARGS),
        finishChunk("tool-calls"),
      ]),
    );

    const { events, result } = streamTurn(INPUT, context, artifactIds, null);
    const collected = await collect(events());

    expect(artifactIds).toEqual([expect.any(String)]);
    expect(collected).toEqual([
      { message: "Creating a block" },
      { reference: { id: artifactIds[0], type: "TEXT" } },
    ]);
    expect(await result.finishReason).toBe("tool-calls");
    expect(await result.responseMessages).toEqual([
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

  test("returns a failed tool call to the model instead of failing the turn", async () => {
    doStream.mockResolvedValue(
      streamOf([
        ...textChunks("Styling"),
        toolCallChunk("edit_style", EDIT_STYLE_ARGS),
        finishChunk("tool-calls"),
      ]),
    );
    const { events, result } = streamTurn(
      INPUT,
      { ...context, resolveArtifactId: throwUnknownArtifact },
      [],
      null,
    );

    expect(await collect(events())).toEqual([{ message: "Styling" }]);
    const messages = await result.responseMessages;
    expect(messages).toEqual([
      expect.objectContaining({ role: "assistant" }),
      {
        role: "tool",
        content: [
          expect.objectContaining({
            toolCallId: "call-1",
            output: expect.objectContaining({ type: expect.stringMatching(/^error-/) }),
          }),
        ],
      },
    ]);
    expect(JSON.stringify(messages)).toContain("Unknown artifact: 5");
  });

  test("returns invalid tool input to the model instead of failing the turn", async () => {
    const artifactIds: string[] = [];
    doStream.mockResolvedValue(
      streamOf([
        toolCallChunk("create_text", { ...CREATE_TEXT_ARGS, size: "huge" }),
        finishChunk("tool-calls"),
      ]),
    );

    const { events, result } = streamTurn(INPUT, context, artifactIds, null);

    expect(await collect(events())).toEqual([]);
    expect(artifactIds).toEqual([]);
    expect(JSON.stringify(await result.responseMessages)).toContain(
      "Invalid input for tool create_text",
    );
  });

  test("does not run tools when the step is cut off", async () => {
    const artifactIds: string[] = [];
    doStream.mockResolvedValue(
      streamOf([toolCallChunk("create_text", CREATE_TEXT_ARGS), finishChunk("length")]),
    );

    const { events, result } = streamTurn(INPUT, context, artifactIds, null);

    expect(await collect(events())).toEqual([]);
    expect(artifactIds).toEqual([]);
    expect(await result.finishReason).toBe("length");
  });

  test("ends the turn cleanly when aborted mid-stream", async () => {
    const controller = new AbortController();
    doStream.mockResolvedValue(streamOf([...textChunks("Hello"), finishChunk("stop")], 20));

    const { events } = streamTurn(INPUT, context, [], null, controller.signal);
    const collected: WriteEvent[] = [];
    for await (const event of events()) {
      collected.push(event);
      controller.abort();
    }

    expect(collected).toEqual([{ message: "Hello" }]);
  });

  test("rejects when the stream reports an error", async () => {
    doStream.mockResolvedValue(streamOf([{ type: "error", error: new Error("boom") }]));

    const { events } = streamTurn(INPUT, context, [], null);

    await expect(collect(events())).rejects.toThrow("boom");
  });
});

describe("write", () => {
  test("replays tool results into the next turn", async () => {
    doStream
      .mockResolvedValueOnce(
        streamOf([
          ...textChunks("Creating a block"),
          toolCallChunk("create_text", CREATE_TEXT_ARGS),
          finishChunk("tool-calls"),
        ]),
      )
      .mockResolvedValueOnce(streamOf([...textChunks("Done"), finishChunk("stop")]));

    const collected = await collect(
      write({ pageId: "page-1", sectionId: null, prompt: "Create a block" }, MOCK_TOOL_CONTEXT),
    );

    expect(collected).toEqual([
      { message: "Creating a block" },
      { reference: { id: expect.any(String), type: "TEXT" } },
      { message: "Done" },
    ]);
    expect(doStream).toHaveBeenCalledTimes(2);
    expect(doStream).toHaveBeenLastCalledWith(
      expect.objectContaining({
        prompt: [
          expect.objectContaining({ role: "system" }),
          expect.objectContaining({ role: "user" }),
          expect.objectContaining({ role: "assistant" }),
          expect.objectContaining({ role: "tool" }),
        ],
      }),
    );
    expect(disconnect).toHaveBeenCalledTimes(1);
  });

  test("stops after a turn without tool calls", async () => {
    doStream.mockResolvedValue(streamOf([...textChunks("Hi there"), finishChunk("stop")]));

    const collected = await collect(
      write({ pageId: "page-1", sectionId: null, prompt: "Say hi" }, MOCK_TOOL_CONTEXT),
    );

    expect(collected).toEqual([{ message: "Hi there" }]);
    expect(doStream).toHaveBeenCalledTimes(1);
  });
});
