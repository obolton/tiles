export interface ChatAction {
  readonly type: string;
  readonly description: string;
}

export interface UserMessage {
  readonly id: string;
  readonly role: "user";
  readonly content: string;
}

export interface AssistantMessage {
  readonly id: string;
  readonly role: "assistant";
  readonly content: string;
  readonly actions: ChatAction[];
}

export type ChatMessage = UserMessage | AssistantMessage;
