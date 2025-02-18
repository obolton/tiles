import type { Meta, StoryObj } from "@storybook/react";

const meta = {
  title: "Tabs",
} satisfies Meta;
export default meta;

export const Default = {
  render: () => (
    <>
      <tab-bar>
        <tab-item id="tab-1" for="panel-1" selected>
          First item
        </tab-item>
        <tab-item id="tab-2" for="panel-2">
          Second item
        </tab-item>
        <tab-item id="tab-3" for="panel-3">
          Third item
        </tab-item>
      </tab-bar>

      <tab-panel id="panel-1" open>
        First panel
      </tab-panel>
      <tab-panel id="panel-2">Second panel</tab-panel>
      <tab-panel id="panel-3">Third panel</tab-panel>
    </>
  ),
} satisfies StoryObj;
