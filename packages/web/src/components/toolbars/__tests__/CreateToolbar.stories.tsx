import "@/elements/floating-toolbar/FloatingToolbar";
import "@/elements/floating-toolbar/ToolbarTab";
import CreateToolbar from "../CreateToolbar";
import InsertButton from "@/components/buttons/InsertButton";
import { flag } from "carillon";
import type { Meta, Story } from "@/test/storybook";

const meta = {
  title: "CreateToolbar",
} satisfies Meta;
export default meta;

export const Default: Story = {
  render: () => (
    <CreateToolbar isPromptOpen={flag(false)}>
      <InsertButton />
    </CreateToolbar>
  ),
};

export const PromptOpen: Story = {
  render: () => (
    <CreateToolbar isPromptOpen={flag(true)}>
      <InsertButton />
    </CreateToolbar>
  ),
};
