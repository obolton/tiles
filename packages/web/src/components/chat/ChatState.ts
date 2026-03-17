import { ReactiveArray, array, flag } from "@/utils/reactivity";
import type { ReactiveFlag } from "@/utils/reactivity";
import type { ChatAction, ChatMessage } from "./types";

const MAX_HISTORY = 40;

type ContentCallback = (chunk: string) => void;

export default class ChatState {
  readonly messages: ReactiveArray<ChatMessage> = array<ChatMessage>([]);
  readonly isStreaming: ReactiveFlag = flag(false);

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
    this.isStreaming.on();
    this.buffer = "";
  }

  subscribe(callback: ContentCallback): void {
    this.subscribers.add(callback);
  }

  unsubscribe(callback: ContentCallback): void {
    this.subscribers.delete(callback);
  }

  append(text: string): void {
    this.buffer += text;
    for (const callback of this.subscribers) {
      callback(text);
    }
  }

  completeMessage(actions: ChatAction[]): void {
    this.messages.push({
      id: crypto.randomUUID(),
      role: "assistant",
      content: this.buffer,
      actions,
    });
    this.isStreaming.off();
    this.buffer = "";
  }

  getHistory(): Array<{ role: "user" | "assistant"; content: string }> {
    const messages = this.messages.value.slice(-MAX_HISTORY);
    return messages.map(({ role, content }) => ({ role, content }));
  }

  clear(): void {
    this.messages.clear();
    this.isStreaming.off();
    this.buffer = "";
    this.subscribers.clear();
  }
}
