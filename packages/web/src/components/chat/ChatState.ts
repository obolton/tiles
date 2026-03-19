import { ReactiveArray, reactive, array } from "@/utils/reactivity";
import type { ChatAction, ChatMessage } from "./types";

const MAX_HISTORY = 40;

export type StreamState = "idle" | "pending" | "responding";

type ContentCallback = (chunk: string) => void;

export default class ChatState {
  readonly messages: ReactiveArray<ChatMessage> = array<ChatMessage>([]);
  readonly state = reactive<StreamState>("idle");

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

  append(text: string): void {
    if (this.state.value === "pending") {
      this.state.value = "responding";
    }
    this.buffer += text;
    for (const callback of this.subscribers) {
      callback(text);
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
        content: this.buffer,
      });
    }
    this.state.value = "idle";
    this.buffer = "";
  }

  getHistory(): Array<{ role: "user" | "assistant"; content: string }> {
    return this.messages.value
      .slice(-MAX_HISTORY)
      .filter((m): m is ChatMessage & { content: string } => !!m.content)
      .map(({ role, content }) => ({ role, content }));
  }

  clear(): void {
    this.messages.clear();
    this.state.value = "idle";
    this.buffer = "";
    this.subscribers.clear();
  }
}
