import { showToast } from "./toasts";

export function handleError(error: Error) {
  showToast("Sorry, an error occurred.", "error");
  console.error(error);
}
