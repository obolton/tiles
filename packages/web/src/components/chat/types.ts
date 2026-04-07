import type { RichTextFormat, RichTextNode } from "@/utils/richText/stream";

export type MessageEvent = string | RichTextFormat | RichTextNode;

export interface ChatAction {
  readonly id?: string;
  readonly type: string;
  readonly label: string;
}

export interface UserMessage {
  readonly id: string;
  readonly role: "user";
  readonly content: string;
}

export interface AssistantMessage {
  readonly id: string;
  readonly role: "assistant";
  readonly content?: string;
  readonly actions?: ChatAction[];
}

export type ChatMessage = UserMessage | AssistantMessage;
