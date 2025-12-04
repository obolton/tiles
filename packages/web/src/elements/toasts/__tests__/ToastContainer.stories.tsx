import { showToast } from "@/utils/toasts";
import type { Meta, StoryObj } from "@storybook/react";
import "../ToastContainer";

const meta = {
  title: "Toasts",
} satisfies Meta;
export default meta;

export const Info = {
  render: () => (
    <>
      <button on:click={() => showToast("This is an info toast", "info")}>
        Show toast
      </button>
      <toast-container />
    </>
  ),
} satisfies StoryObj;

export const Success = {
  render: () => (
    <>
      <button on:click={() => showToast("This is an info toast", "success")}>
        Show toast
      </button>
      <toast-container />
    </>
  ),
} satisfies StoryObj;

export const Error = {
  render: () => (
    <>
      <button on:click={() => showToast("This is an error toast", "error")}>
        Show toast
      </button>
      <toast-container />
    </>
  ),
} satisfies StoryObj;
