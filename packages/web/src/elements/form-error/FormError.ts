import type { GlobalHTMLAttributes } from "jsx/html-attributes";

type FormControl = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

function isFormControl(element: Element | null): element is FormControl {
  return (
    element instanceof HTMLInputElement ||
    element instanceof HTMLSelectElement ||
    element instanceof HTMLTextAreaElement
  );
}

function firstInvalidControl(form: HTMLFormElement | null): FormControl | null {
  for (const element of form?.elements ?? []) {
    if (isFormControl(element) && !element.validity.valid) {
      return element;
    }
  }
  return null;
}

export interface FormErrorAttributes extends GlobalHTMLAttributes {
  /** The ID of the form control whose validation message to show. */
  for?: string;
}

declare global {
  interface HTMLElementTagNameMap {
    "form-error": FormError;
  }
}

declare module "jsx/html-attributes" {
  interface HTMLAttributesByTagName {
    "form-error": FormErrorAttributes;
  }
}

/**
 * Shows the validation message of a form control inline, in place of the
 * browser's validation bubble, whenever the control reports that it is
 * invalid. The message clears as soon as the control's value changes.
 */
export default class FormError extends HTMLElement {
  static readonly observedAttributes: (keyof FormErrorAttributes)[] = ["for"] as const;

  private readonly internals: ElementInternals;
  private control: FormControl | null = null;

  constructor() {
    super();

    this.internals = this.attachInternals();
    this.internals.role = "alert";
  }

  connectedCallback() {
    this.attach();
  }

  disconnectedCallback() {
    this.detach();
  }

  attributeChangedCallback() {
    if (this.isConnected) {
      this.detach();
      this.attach();
    }
  }

  handleEvent(event: Event) {
    switch (event.type) {
      case "invalid":
        event.preventDefault();
        this.show();
        break;

      case "input":
      case "change":
        this.clear();
        break;
    }
  }

  private attach() {
    const forId = this.getAttribute("for");
    const control = forId ? document.getElementById(forId) : null;
    if (!isFormControl(control)) {
      return;
    }

    this.control = control;
    control.addEventListener("invalid", this);
    control.addEventListener("input", this);
    control.addEventListener("change", this);
  }

  private detach() {
    const control = this.control;
    if (!control) {
      return;
    }

    control.removeEventListener("invalid", this);
    control.removeEventListener("input", this);
    control.removeEventListener("change", this);
    this.clear();
    this.control = null;
  }

  private show() {
    const control = this.control;
    if (!control) {
      return;
    }

    this.textContent = control.validationMessage;

    // Cancelling the invalid event also stops the browser from focusing the
    // first invalid control, so do that here instead
    if (firstInvalidControl(control.form) === control) {
      control.focus();
    }
  }

  private clear() {
    this.replaceChildren();
  }
}

customElements.define("form-error", FormError);
