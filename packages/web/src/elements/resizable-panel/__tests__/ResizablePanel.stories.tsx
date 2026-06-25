import "../ResizablePanel";
import "./stories.css";
import type { PanelResizeEvent } from "../events";
import type { Meta, Story } from "@/test/storybook";

const meta = {
  title: "ResizablePanel",
} satisfies Meta;
export default meta;

function applyWidth(event: PanelResizeEvent) {
  if (event.currentTarget instanceof HTMLElement) {
    event.currentTarget.style.width = `${event.size}px`;
  }
}

function applyHeight(event: PanelResizeEvent) {
  if (event.currentTarget instanceof HTMLElement) {
    event.currentTarget.style.height = `${event.size}px`;
  }
}

export const Left: Story = {
  render: () => (
    <div class="demo">
      <resizable-panel
        class="panel horizontal"
        edge="left"
        size={240}
        min={160}
        max={400}
        on:panelresize={applyWidth}
      >
        Left panel
      </resizable-panel>
      <div class="content">Page content</div>
    </div>
  ),
};

export const Right: Story = {
  render: () => (
    <div class="demo">
      <div class="content">Page content</div>
      <resizable-panel
        class="panel horizontal"
        edge="right"
        size={240}
        min={160}
        max={400}
        on:panelresize={applyWidth}
      >
        Right panel
      </resizable-panel>
    </div>
  ),
};

export const Top: Story = {
  render: () => (
    <div class="demo column">
      <resizable-panel
        class="panel vertical"
        edge="top"
        size={160}
        min={80}
        max={280}
        on:panelresize={applyHeight}
      >
        Top panel
      </resizable-panel>
      <div class="content">Page content</div>
    </div>
  ),
};

export const Bottom: Story = {
  render: () => (
    <div class="demo column">
      <div class="content">Page content</div>
      <resizable-panel
        class="panel vertical"
        edge="bottom"
        size={160}
        min={80}
        max={280}
        on:panelresize={applyHeight}
      >
        Bottom panel
      </resizable-panel>
    </div>
  ),
};

export const WithLimits: Story = {
  render: () => (
    <div class="demo">
      <resizable-panel
        class="panel horizontal"
        edge="left"
        size={240}
        min={200}
        max={280}
        on:panelresize={applyWidth}
      >
        Clamped panel
      </resizable-panel>
      <div class="content">Page content</div>
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div class="demo">
      <resizable-panel class="panel horizontal" edge="left" size={240} disabled>
        Resizing disabled
      </resizable-panel>
      <div class="content">Page content</div>
    </div>
  ),
};
