import MessageBubble from "../MessageBubble";
import ActivityIndicator from "../ActivityIndicator";
import {
  REFERENCES,
  RICH_RESPONSE,
  SHORT_RESPONSE,
  assistantMessage,
  userMessage,
} from "@/test/fixtures/chat";
import type { JSX } from "jsx/jsx";
import type { Meta, Story } from "@/test/storybook";

const meta = {
  title: "MessageBubble",
} satisfies Meta;
export default meta;

function Column({ children }: { children: JSX.Node }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "600px" }}>
      {children}
    </div>
  );
}

export const User: Story = {
  render: () => (
    <Column>
      <MessageBubble message={userMessage("Add a summary of the key points to the top")} />
    </Column>
  ),
};

export const MultilineUser: Story = {
  render: () => (
    <Column>
      <MessageBubble
        message={userMessage(
          "Rewrite the intro so it's:\n- shorter\n- friendlier\n- one paragraph",
        )}
      />
    </Column>
  ),
};

export const Assistant: Story = {
  render: () => (
    <Column>
      <MessageBubble message={assistantMessage(SHORT_RESPONSE)} />
    </Column>
  ),
};

export const RichAssistant: Story = {
  render: () => (
    <Column>
      <MessageBubble message={assistantMessage(RICH_RESPONSE)} />
    </Column>
  ),
};

export const References: Story = {
  render: () => (
    <Column>
      <MessageBubble message={assistantMessage(SHORT_RESPONSE, REFERENCES)} />
    </Column>
  ),
};

export const Activity: Story = {
  render: () => (
    <Column>
      <ActivityIndicator />
    </Column>
  ),
};
