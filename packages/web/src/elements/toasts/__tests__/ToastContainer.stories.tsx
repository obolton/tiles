import { showToast } from "@/utils/toasts";
import type { Meta, Story } from "@/test/storybook";
import "../ToastContainer";

const meta = {
  title: "Toasts",
} satisfies Meta;
export default meta;

export const Info: Story = {
  render: () => (
    <>
      <button on:click={() => showToast("This is an info toast", "info")}>Show toast</button>
      <toast-container />
    </>
  ),
};

export const Success: Story = {
  render: () => (
    <>
      <button on:click={() => showToast("This is an info toast", "success")}>Show toast</button>
      <toast-container />
    </>
  ),
};

export const Error: Story = {
  render: () => (
    <>
      <button on:click={() => showToast("This is an error toast", "error")}>Show toast</button>
      <toast-container />
    </>
  ),
};
