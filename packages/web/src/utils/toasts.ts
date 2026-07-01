import type ToastContainer from "@/elements/toasts/ToastContainer";
import type { ToastType } from "@/elements/toasts/ToastContainer";

export function showToast(message: string, type?: ToastType) {
  return (document.getElementsByTagName("toast-container") as HTMLCollectionOf<ToastContainer>)
    .item(0)
    ?.showToast(message, type);
}

export function redirectWithToast(location: string, message: string, type?: ToastType) {
  sessionStorage.setItem("toast", JSON.stringify({ message, type }));
  window.location.href = location;
}
