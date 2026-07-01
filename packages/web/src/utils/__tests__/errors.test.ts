import { describe, expect, test, vi } from "vitest";
import { handleError } from "../errors";
import { showToast } from "../toasts";

vi.mock("../toasts");

describe("handleError", () => {
  test("shows a toast and logs the error", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementationOnce(() => {});

    const error = new Error("Test error");
    handleError(error);

    expect(showToast).toHaveBeenCalledWith("Sorry, an error occurred.", "error");
    expect(consoleError).toHaveBeenCalledWith(error);
  });
});
