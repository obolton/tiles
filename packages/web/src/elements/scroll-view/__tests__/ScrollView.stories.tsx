import "../ScrollView";
import "./stories.css";
import type { Meta, StoryObj } from "@storybook/html-vite";
import { renderStory } from "@/test/storybook";

const meta = {
  title: "ScrollView",
} satisfies Meta;
export default meta;

export const Default = {
  render: () =>
    renderStory(
      <scroll-view class="carousel">
        <div>Item 1</div>
        <div>Item 2</div>
        <div>Item 3</div>
        <div>Item 4</div>
        <div>Item 5</div>
        <div>Item 6</div>
        <div>Item 7</div>
        <div>Item 8</div>
        <div>Item 9</div>
        <div>Item 10</div>
      </scroll-view>,
    ),
} satisfies StoryObj;
