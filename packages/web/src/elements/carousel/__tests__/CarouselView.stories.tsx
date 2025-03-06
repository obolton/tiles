import "../CarouselView";
import "./stories.css";
import type { Meta, StoryObj } from "@storybook/react";

const meta = {
  title: "CarouselView",
} satisfies Meta;
export default meta;

export const Default = {
  render: () => (
    <carousel-view class="carousel">
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
    </carousel-view>
  ),
} satisfies StoryObj;
