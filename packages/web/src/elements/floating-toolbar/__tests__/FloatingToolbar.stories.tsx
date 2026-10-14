import "../FloatingToolbar";
import "../ToolbarTab";
import ToolbarButton from "@/components/buttons/ToolbarButton";
import ToolbarGroup from "@/components/toolbars/ToolbarGroup";
import BoldIcon from "@/icons/bold.svg?jsx";
import ItalicIcon from "@/icons/italic.svg?jsx";
import UnderlineIcon from "@/icons/underline.svg?jsx";
import AlignLeftIcon from "@/icons/align-left.svg?jsx";
import AlignCenterIcon from "@/icons/align-center.svg?jsx";
import AlignRightIcon from "@/icons/align-right.svg?jsx";
import LinkIcon from "@/icons/link.svg?jsx";
import TrashIcon from "@/icons/trash.svg?jsx";
import type { Meta, Story } from "@/test/storybook";

const meta = {
  title: "FloatingToolbar",
} satisfies Meta;
export default meta;

export const SingleTab: Story = {
  render: () => (
    <floating-toolbar aria-label="Text toolbar">
      <toolbar-tab name="text" label="Text">
        <ToolbarGroup label="Text style">
          <ToolbarButton label="Bold">
            <BoldIcon aria-hidden="true" />
          </ToolbarButton>
          <ToolbarButton label="Italic">
            <ItalicIcon aria-hidden="true" />
          </ToolbarButton>
          <ToolbarButton label="Underline">
            <UnderlineIcon aria-hidden="true" />
          </ToolbarButton>
        </ToolbarGroup>

        <ToolbarGroup label="Alignment">
          <ToolbarButton label="Align left">
            <AlignLeftIcon aria-hidden="true" />
          </ToolbarButton>
          <ToolbarButton label="Align center">
            <AlignCenterIcon aria-hidden="true" />
          </ToolbarButton>
          <ToolbarButton label="Align right">
            <AlignRightIcon aria-hidden="true" />
          </ToolbarButton>
        </ToolbarGroup>
      </toolbar-tab>
    </floating-toolbar>
  ),
};

export const MultipleTabs: Story = {
  render: () => (
    <floating-toolbar aria-label="Editor toolbar" name="story-toolbar">
      <toolbar-tab name="format" label="Format">
        <ToolbarGroup label="Text style">
          <ToolbarButton label="Bold">
            <BoldIcon aria-hidden="true" />
          </ToolbarButton>
          <ToolbarButton label="Italic">
            <ItalicIcon aria-hidden="true" />
          </ToolbarButton>
          <ToolbarButton label="Underline">
            <UnderlineIcon aria-hidden="true" />
          </ToolbarButton>
        </ToolbarGroup>
      </toolbar-tab>

      <toolbar-tab name="insert" label="Insert">
        <ToolbarGroup label="Insert">
          <ToolbarButton label="Link">
            <LinkIcon aria-hidden="true" />
            Link
          </ToolbarButton>
        </ToolbarGroup>
      </toolbar-tab>
    </floating-toolbar>
  ),
};

export const WithPressedState: Story = {
  render: () => (
    <floating-toolbar aria-label="Formatting toolbar">
      <toolbar-tab name="format" label="Format">
        <ToolbarGroup label="Text style">
          <ToolbarButton label="Bold" aria-pressed="true">
            <BoldIcon aria-hidden="true" />
          </ToolbarButton>
          <ToolbarButton label="Italic" aria-pressed="false">
            <ItalicIcon aria-hidden="true" />
          </ToolbarButton>
          <ToolbarButton label="Underline" aria-pressed="true">
            <UnderlineIcon aria-hidden="true" />
          </ToolbarButton>
        </ToolbarGroup>
      </toolbar-tab>
    </floating-toolbar>
  ),
};

export const WithDestructiveButton: Story = {
  render: () => (
    <floating-toolbar aria-label="Selection toolbar">
      <toolbar-tab name="selection" label="Selection">
        <ToolbarGroup label="Actions">
          <ToolbarButton label="Link">
            <LinkIcon aria-hidden="true" />
          </ToolbarButton>
        </ToolbarGroup>

        <ToolbarGroup label="Destructive">
          <ToolbarButton label="Delete" destructive>
            <TrashIcon aria-hidden="true" />
          </ToolbarButton>
        </ToolbarGroup>
      </toolbar-tab>
    </floating-toolbar>
  ),
};

export const WithTextLabels: Story = {
  render: () => (
    <floating-toolbar aria-label="Actions toolbar">
      <toolbar-tab name="actions" label="Actions">
        <ToolbarGroup label="Insert">
          <ToolbarButton label="Insert link">
            <LinkIcon aria-hidden="true" />
            Insert link
          </ToolbarButton>
        </ToolbarGroup>

        <ToolbarGroup label="Danger zone">
          <ToolbarButton label="Delete item" destructive>
            <TrashIcon aria-hidden="true" />
            Delete
          </ToolbarButton>
        </ToolbarGroup>
      </toolbar-tab>
    </floating-toolbar>
  ),
  parameters: {
    a11y: {
      config: {
        // The destructive button uses the global --destructive-color token, which is below the AA
        // contrast threshold by design.
        rules: [{ id: "color-contrast", enabled: false }],
      },
    },
  },
};
