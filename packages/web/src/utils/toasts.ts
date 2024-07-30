import { set } from "./state";
import type ToastContainer from "@/components/ToastContainer";
import type { ToastType } from "@/components/ToastContainer";

export function showToast(message: string, type?: ToastType) {
  return (
    document.getElementsByTagName(
      "toast-container",
    ) as HTMLCollectionOf<ToastContainer>
  )
    .item(0)
    ?.showToast(message, type);
}

export function redirectWithToast(
  location: string,
  message: string,
  type?: ToastType,
) {
  set("toast", { message, type });
  window.location.href = location;
}
