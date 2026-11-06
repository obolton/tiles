import { afterEach, describe, expect, test } from "vitest";
import { render } from "jsx/dom";
import "../FormError";

function renderForm() {
  document.body.append(
    ...render(
      <form>
        <input id="name" name="name" type="text" required />
        <form-error id="name-error" for="name" />
        <input id="url" name="url" type="url" />
        <form-error id="url-error" for="url" />
      </form>,
    ),
  );
}

function query<T extends Element>(selector: string, type: new () => T): T {
  const element = document.querySelector(selector);
  if (!(element instanceof type)) {
    throw new Error(`Missing ${selector}`);
  }
  return element;
}

afterEach(() => {
  document.body.replaceChildren();
});

describe("FormError", () => {
  test("shows the control's validation message when it reports invalid", () => {
    renderForm();
    const input = query("#url", HTMLInputElement);
    const error = query("#url-error", HTMLElement);
    input.value = "https://example.com";
    input.setCustomValidity("Enter a link to a YouTube or Vimeo video.");

    expect(input.reportValidity()).toBe(false);

    expect(error.textContent).toBe("Enter a link to a YouTube or Vimeo video.");
    expect(input.getAttribute("aria-invalid")).toBe("true");
  });

  test("suppresses the browser's validation bubble", () => {
    renderForm();
    const input = query("#url", HTMLInputElement);
    input.setCustomValidity("Invalid");
    let defaultPrevented = false;
    input.addEventListener("invalid", (event) => {
      defaultPrevented = event.defaultPrevented;
    });

    input.reportValidity();

    expect(defaultPrevented).toBe(true);
  });

  test("clears the message when the value changes", () => {
    renderForm();
    const input = query("#url", HTMLInputElement);
    const error = query("#url-error", HTMLElement);
    input.setCustomValidity("Invalid");
    input.reportValidity();

    input.setCustomValidity("");
    input.dispatchEvent(new Event("input", { bubbles: true }));

    expect(error.textContent).toBe("");
    expect(input.hasAttribute("aria-invalid")).toBe(false);
  });

  test("focuses only the first invalid control when the form is submitted", () => {
    renderForm();
    const name = query("#name", HTMLInputElement);
    const url = query("#url", HTMLInputElement);
    url.setCustomValidity("Invalid");

    query("form", HTMLFormElement).requestSubmit();

    expect(query("#name-error", HTMLElement).textContent).not.toBe("");
    expect(query("#url-error", HTMLElement).textContent).toBe("Invalid");
    expect(document.activeElement).toBe(name);
  });

  test("shows nothing for a control that is valid", () => {
    renderForm();
    const input = query("#url", HTMLInputElement);
    input.value = "https://example.com";

    expect(input.reportValidity()).toBe(true);
    expect(query("#url-error", HTMLElement).textContent).toBe("");
  });
});
