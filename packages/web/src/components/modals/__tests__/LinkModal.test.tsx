import { afterEach, describe, expect, test, vi } from "vitest";
import { render } from "jsx/dom";
import LinkModal from "../LinkModal";
import { LinkPreviewError } from "@/models/Link";
import { handleError } from "@/utils/errors";

vi.mock("@/utils/errors");

vi.mock("@/api/client", () => ({
  default: {},
}));

const URL = "https://example.com/page";

function renderModal(confirm: (result: unknown) => Promise<void> | void) {
  document.body.append(
    ...render(
      <LinkModal cancel={() => {}} confirm={confirm} workspaceId="workspace-1" showPages={false} />,
    ),
  );
  const form = document.querySelector("form");
  const input = document.getElementById("link-url");
  const submit = document.querySelector("button[type='submit']");
  const message = document.getElementById("link-url-message");
  if (!form || !(input instanceof HTMLInputElement) || !submit || !message) {
    throw new Error("Missing form controls");
  }
  return { form, input, submit, message };
}

function enter(input: HTMLInputElement, value: string) {
  input.value = value;
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

async function save(form: HTMLFormElement) {
  form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  await new Promise((resolve) => setTimeout(resolve));
}

afterEach(() => {
  document.body.replaceChildren();
});

describe("LinkModal", () => {
  test("saves the URL with a preview", async () => {
    const confirm = vi.fn();
    const { form, input } = renderModal(confirm);

    enter(input, URL);
    await save(form);

    expect(confirm).toHaveBeenCalledWith({ url: URL, preview: true });
  });

  test("explains a failed preview and offers to save the link without one", async () => {
    const confirm = vi.fn().mockRejectedValueOnce(new LinkPreviewError(URL));
    const { form, input, submit, message } = renderModal(confirm);

    enter(input, URL);
    await save(form);

    expect(message.textContent).toContain("Couldn’t load a preview for this link.");
    expect(submit.textContent).toBe("Save without preview");
    expect(document.activeElement).toBe(input);
    expect(handleError).not.toHaveBeenCalled();

    await save(form);

    expect(confirm).toHaveBeenLastCalledWith({ url: URL, preview: false });
  });

  test("clears the preview message when the URL changes", async () => {
    const confirm = vi.fn().mockRejectedValueOnce(new LinkPreviewError(URL));
    const { form, input, submit, message } = renderModal(confirm);

    enter(input, URL);
    await save(form);
    enter(input, "https://example.com/other");
    await save(form);

    expect(message.textContent).toBe("");
    expect(submit.textContent).toBe("Save");
    expect(confirm).toHaveBeenLastCalledWith({ url: "https://example.com/other", preview: true });
  });

  test("reports other errors", async () => {
    const error = new Error("Boom");
    const confirm = vi.fn().mockRejectedValueOnce(error);
    const { form, input, message } = renderModal(confirm);

    enter(input, URL);
    await save(form);

    expect(handleError).toHaveBeenCalledWith(error);
    expect(message.textContent).toBe("");
  });
});
