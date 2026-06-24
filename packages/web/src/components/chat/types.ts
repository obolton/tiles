import type { RichTextFormat, RichTextNode } from "doc/richText/events";
import type { TileType } from "doc/types/enums";

export type MessageEvent = string | RichTextFormat | RichTextNode;

export interface ChatReference {
  readonly id: string;
  readonly type: TileType;
}

export interface UserMessage {
  readonly id: string;
  readonly role: "user";
  readonly content: string;
}

export interface AssistantMessage {
  readonly id: string;
  readonly role: "assistant";
  readonly content?: HTMLElement;
  readonly references?: ChatReference[];
}

export type ChatMessage = UserMessage | AssistantMessage;
