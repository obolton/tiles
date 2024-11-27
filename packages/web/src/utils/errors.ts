import { showToast } from "./toasts";

export function handleError(error: Error | unknown) {
  showToast("Sorry, an error occurred.", "error");
  console.error(error);
}
