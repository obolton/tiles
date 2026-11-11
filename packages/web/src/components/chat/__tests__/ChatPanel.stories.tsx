import * as Y from "yjs";
import Editor from "@/editor/Editor";
import BottomBar from "@/components/pages/BottomBar";
import { PAGE } from "@/test/fixtures/Page";
import {
  REFERENCES,
  RICH_RESPONSE,
  SHORT_RESPONSE,
  assistantMessage,
  createTextTile,
  userMessage,
} from "@/test/fixtures/chat";
import type { StreamState } from "../ChatState";
import type { ChatMessage, MessageEvent } from "../types";
import type { Meta, Story } from "@/test/storybook";

const meta = {
  title: "ChatPanel",
} satisfies Meta;
export default meta;

const editor = Editor.init(PAGE, new Y.Doc());

const tileIds = ["Quarterly summary", "Next steps"].map((text) =>
  createTextTile(editor.page, text),
);

const CONVERSATION: () => ChatMessage[] = () => [
  userMessage("Add a summary of the key points to the top of the page"),
  assistantMessage(SHORT_RESPONSE),
  assistantMessage([], REFERENCES.slice(0, 1)),
  userMessage("What's left to do before launch?"),
  assistantMessage(RICH_RESPONSE),
];

interface PanelOptions {
  messages?: ChatMessage[];
  state?: StreamState;
  stream?: MessageEvent[];
  references?: string[];
  textColor?: string;
}

function Panel({
  messages = [],
  state = "idle",
  stream = [],
  references = [],
  textColor,
}: PanelOptions) {
  editor.chat.clear();
  editor.chat.messages.replace(messages);
  editor.chat.state.value = state;
  editor.references.replace(references);
  editor.isPromptToolbarOpen.value = true;
  editor.isPromptOpen.value = true;

  if (stream.length) {
    // The streaming bubble subscribes when it renders, so events are sent afterwards
    queueMicrotask(() => {
      for (const event of stream) {
        editor.chat.append(event);
      }
    });
  }

  return (
    <div
      style={{
        position: "fixed",
        insetInline: "var(--bottom-bar-inset)",
        insetBlockEnd: "var(--bottom-bar-inset)",
        "--text-color": textColor,
        color: textColor && "var(--text-color)",
      }}
    >
      <BottomBar editor={editor} />
    </div>
  );
}

export const Empty: Story = {
  render: () => <Panel />,
};

export const Conversation: Story = {
  render: () => <Panel messages={CONVERSATION()} />,
};

export const WithReferences: Story = {
  render: () => <Panel messages={CONVERSATION()} references={tileIds} />,
};

export const Pending: Story = {
  render: () => <Panel messages={[userMessage("Summarize this page")]} state="pending" />,
};

export const Responding: Story = {
  render: () => (
    <Panel
      messages={[userMessage("What's left to do before launch?")]}
      state="responding"
      stream={RICH_RESPONSE.slice(0, 12)}
    />
  ),
};

export const LongConversation: Story = {
  render: () => <Panel messages={[...CONVERSATION(), ...CONVERSATION(), ...CONVERSATION()]} />,
};

/** Messages use the UI text color rather than inheriting the document's theme color. */
export const ThemedDocument: Story = {
  render: () => <Panel messages={CONVERSATION()} textColor="oklch(40% 0.08 50deg)" />,
};

export const Phone: Story = {
  render: () => <Panel messages={CONVERSATION()} />,
  globals: { viewport: { value: "mobile2", isRotated: false } },
};
