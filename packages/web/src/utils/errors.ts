import { showToast } from "./toasts";

export function handleError(error: unknown, message = "Sorry, an error occurred.") {
  showToast(message, "error");
  console.error(error);
}
