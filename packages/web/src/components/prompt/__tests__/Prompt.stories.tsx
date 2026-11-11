import * as Y from "yjs";
import Editor from "@/editor/Editor";
import Section from "@/models/Section";
import Prompt from "../Prompt";
import InlinePrompt from "../InlinePrompt";
import GenerateImagePanel from "@/components/fills/GenerateImagePanel";
import { PAGE } from "@/test/fixtures/Page";
import { createTextTile } from "@/test/fixtures/chat";
import type { JSX } from "jsx/jsx";
import type { Meta, Story } from "@/test/storybook";

const meta = {
  title: "Prompt",
} satisfies Meta;
export default meta;

const editor = Editor.init(PAGE, new Y.Doc());

const tileIds = [
  createTextTile(editor.page, "A summary of the quarter's key results"),
  editor.page.createTile(Section.createMap({ layout: "GRID", height: 10 }), {}).id,
];

async function onSubmit() {}

function Surface({ children }: { children: JSX.Node }) {
  return (
    <div
      style={{
        width: "480px",
        borderRadius: "var(--border-radius)",
        background: "var(--ui-background-color)",
        boxShadow: "var(--surface-shadow)",
      }}
    >
      {children}
    </div>
  );
}

function setReferences(ids: string[]) {
  editor.references.replace(ids);
}

export const Default: Story = {
  render: () => {
    setReferences([]);
    return (
      <Surface>
        <Prompt placeholder="Ask anything" submitTooltip="Send" onSubmit={onSubmit} />
      </Surface>
    );
  },
};

export const WithReferences: Story = {
  render: () => {
    setReferences(tileIds);
    return (
      <Surface>
        <Prompt placeholder="Ask anything" submitTooltip="Send" onSubmit={onSubmit} />
      </Surface>
    );
  },
};

export const GenerateImage: Story = {
  render: () => {
    setReferences([]);
    return (
      <Surface>
        <GenerateImagePanel onChange={() => {}} />
      </Surface>
    );
  },
};

export const Inline: Story = {
  render: () => {
    setReferences([]);
    return (
      <p
        className="rich-text"
        ref={(element) => requestAnimationFrame(() => element.querySelector("form")?.showPopover())}
      >
        The quarter closed with strong growth across every region.
        <InlinePrompt placeholder="Ask anything" onSubmit={onSubmit} />
      </p>
    );
  },
};
