import { beforeEach, describe, expect, test, vi } from "vitest";
import ChatState from "../ChatState";
import type { ChatReference } from "../types";

const REFERENCE: ChatReference = { id: "tile-id", type: "TEXT" };

function assistantContent(text: string): HTMLElement {
  const element = document.createElement("div");
  element.textContent = text;
  return element;
}

describe("ChatState", () => {
  let chat: ChatState;

  beforeEach(() => {
    chat = new ChatState();
  });

  describe("addUserMessage", () => {
    test("pushes a user message with a unique id", () => {
      chat.addUserMessage("Hello");
      chat.addUserMessage("Again");

      expect(chat.hasMessages).toBe(true);
      expect(chat.messages.value).toMatchObject([
        { role: "user", content: "Hello" },
        { role: "user", content: "Again" },
      ]);
      const [first, second] = chat.messages.value;
      expect(first?.id).toBeDefined();
      expect(first?.id).not.toBe(second?.id);
    });
  });

  describe("addReference", () => {
    test("pushes an assistant message carrying the reference", () => {
      chat.addReference(REFERENCE);

      expect(chat.messages.value).toMatchObject([{ role: "assistant", references: [REFERENCE] }]);
    });
  });

  describe("streaming", () => {
    test("starts idle with no messages", () => {
      expect(chat.state.value).toBe("idle");
      expect(chat.hasMessages).toBe(false);
    });

    test("beginStreaming moves to pending and the first append to responding", () => {
      chat.beginStreaming();
      expect(chat.state.value).toBe("pending");

      chat.append("Hi");
      expect(chat.state.value).toBe("responding");

      chat.append(" there");
      expect(chat.state.value).toBe("responding");
    });

    test("completeStreaming pushes an assistant message when text was streamed", () => {
      const destination = assistantContent("Hi");
      chat.beginStreaming();
      chat.append("Hi");
      chat.destination = destination;

      chat.completeStreaming();

      expect(chat.state.value).toBe("idle");
      expect(chat.destination).toBeNull();
      expect(chat.messages.value).toMatchObject([{ role: "assistant", content: destination }]);
    });

    test("completeStreaming pushes a message without content when there is no destination", () => {
      chat.beginStreaming();
      chat.append("Hi");

      chat.completeStreaming();

      expect(chat.messages.value).toHaveLength(1);
      expect(chat.messages.value[0]).toMatchObject({ role: "assistant" });
      expect(chat.messages.value[0]).not.toHaveProperty("content", expect.anything());
    });

    test("completeStreaming does not push a message when nothing was streamed", () => {
      chat.beginStreaming();
      chat.append({ bold: true });
      chat.append({ type: "paragraph" });
      chat.destination = assistantContent("");

      chat.completeStreaming();

      expect(chat.state.value).toBe("idle");
      expect(chat.destination).toBeNull();
      expect(chat.hasMessages).toBe(false);
    });

    test("beginStreaming resets the buffer from a previous stream", () => {
      chat.beginStreaming();
      chat.append("stale");

      chat.beginStreaming();
      chat.completeStreaming();

      expect(chat.hasMessages).toBe(false);
    });
  });

  describe("subscribe", () => {
    test("fans out every event to subscribers", () => {
      const first = vi.fn();
      const second = vi.fn();
      chat.subscribe(first);
      chat.subscribe(second);

      chat.append("text");
      chat.append({ bold: true });
      chat.append({ type: "paragraph" });

      for (const callback of [first, second]) {
        expect(callback.mock.calls).toEqual([["text"], [{ bold: true }], [{ type: "paragraph" }]]);
      }
    });

    test("unsubscribe stops delivery", () => {
      const callback = vi.fn();
      chat.subscribe(callback);
      chat.unsubscribe(callback);

      chat.append("text");

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe("getHistory", () => {
    test("returns user text and assistant textContent in order", () => {
      chat.addUserMessage("Question");
      chat.beginStreaming();
      chat.append("Answer");
      chat.destination = assistantContent("Answer");
      chat.completeStreaming();

      expect(chat.getHistory()).toEqual([
        { role: "user", content: "Question" },
        { role: "assistant", content: "Answer" },
      ]);
    });

    test("skips assistant messages without content", () => {
      chat.addUserMessage("Question");
      chat.addReference(REFERENCE);
      chat.beginStreaming();
      chat.append("Answer");
      chat.completeStreaming();

      expect(chat.getHistory()).toEqual([{ role: "user", content: "Question" }]);
    });

    test("includes block separators in the streamed text", () => {
      chat.beginStreaming();
      chat.append({ type: "paragraph" });
      chat.append("One");
      chat.append({ type: "paragraph" });
      chat.append("Two");
      chat.destination = assistantContent("One\nTwo");
      chat.completeStreaming();

      expect(chat.getHistory()).toEqual([{ role: "assistant", content: "One\nTwo" }]);
    });

    test("caps the history at the most recent 40 messages", () => {
      for (let i = 0; i < 45; i++) {
        chat.addUserMessage(`m${i}`);
      }

      const history = chat.getHistory();

      expect(history).toHaveLength(40);
      expect(history[0]).toEqual({ role: "user", content: "m5" });
      expect(history[39]).toEqual({ role: "user", content: "m44" });
    });
  });

  describe("clear", () => {
    test("resets messages, state, destination and subscribers", () => {
      const callback = vi.fn();
      chat.subscribe(callback);
      chat.addUserMessage("Question");
      chat.beginStreaming();
      chat.append("partial");
      chat.destination = assistantContent("partial");

      chat.clear();
      callback.mockClear();

      expect(chat.hasMessages).toBe(false);
      expect(chat.state.value).toBe("idle");
      expect(chat.destination).toBeNull();

      chat.completeStreaming();
      expect(chat.hasMessages).toBe(false);

      chat.append("after");
      expect(callback).not.toHaveBeenCalled();
    });
  });
});
