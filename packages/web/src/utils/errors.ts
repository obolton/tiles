import { showToast } from "./toasts";

export function handleError(error: unknown) {
  showToast("Sorry, an error occurred.", "error");
  console.error(error);
}
