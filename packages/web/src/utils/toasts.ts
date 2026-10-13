import { navigate } from "@/utils/navigation";
import type { ToastType } from "@/elements/toasts/ToastContainer";

export function showToast(message: string, type?: ToastType) {
  return document.getElementsByTagName("toast-container").item(0)?.showToast(message, type);
}

export function redirectWithToast(location: string, message: string, type?: ToastType) {
  sessionStorage.setItem("toast", JSON.stringify({ message, type }));
  navigate(location, { replace: true });
}
