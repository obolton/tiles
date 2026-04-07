import { ReactiveArray, reactive, array } from "@/utils/reactivity";
import type { ChatAction, ChatMessage, MessageEvent } from "./types";

const MAX_HISTORY = 40;

export type StreamState = "idle" | "pending" | "responding";

type ContentCallback = (event: MessageEvent) => void;

export default class ChatState {
  readonly messages: ReactiveArray<ChatMessage> = array<ChatMessage>([]);
  readonly state = reactive<StreamState>("idle");

  destination: HTMLElement | null = null;
  private buffer = "";
  private readonly subscribers = new Set<ContentCallback>();

  get hasMessages(): boolean {
    return this.messages.length > 0;
  }

  addUserMessage(content: string): void {
    this.messages.push({
      id: crypto.randomUUID(),
      role: "user",
      content,
    });
  }

  beginStreaming(): void {
    this.state.value = "pending";
    this.buffer = "";
  }

  subscribe(callback: ContentCallback): void {
    this.subscribers.add(callback);
  }

  unsubscribe(callback: ContentCallback): void {
    this.subscribers.delete(callback);
  }

  append(event: MessageEvent): void {
    if (this.state.value === "pending") {
      this.state.value = "responding";
    }
    if (typeof event === "string") {
      this.buffer += event;
    } else if ("type" in event && this.buffer) {
      this.buffer += "\n";
    }
    for (const callback of this.subscribers) {
      callback(event);
    }
  }

  addAction(action: ChatAction): void {
    this.messages.push({
      id: crypto.randomUUID(),
      role: "assistant",
      actions: [action],
    });
  }

  completeStreaming(): void {
    if (this.buffer) {
      this.messages.push({
        id: crypto.randomUUID(),
        role: "assistant",
        content: this.destination ?? undefined,
      });
    }
    this.state.value = "idle";
    this.buffer = "";
    this.destination = null;
  }

  getHistory(): Array<{ role: "user" | "assistant"; content: string }> {
    const history: Array<{ role: "user" | "assistant"; content: string }> = [];
    for (const m of this.messages.value.slice(-MAX_HISTORY)) {
      if (m.role === "user") {
        history.push({ role: m.role, content: m.content });
      } else if (m.content) {
        history.push({ role: m.role, content: m.content.textContent ?? "" });
      }
    }
    return history;
  }

  clear(): void {
    this.messages.clear();
    this.state.value = "idle";
    this.buffer = "";
    this.destination = null;
    this.subscribers.clear();
  }
}
