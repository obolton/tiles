import { getAcceptableDragItem } from "@/utils/media";
import type { GlobalHTMLAttributes } from "@/jsx/html-attributes";

export interface FilePickerAttributes extends GlobalHTMLAttributes {
  accept?: string;
}

declare global {
  interface HTMLElementTagNameMap {
    "file-picker": FilePicker;
  }
}

declare module "@/jsx/html-attributes" {
  interface HTMLAttributesByTagName {
    "file-picker": FilePickerAttributes;
  }
}

export default class FilePicker extends HTMLElement {
  static observedAttributes: (keyof FilePickerAttributes)[] = ["accept"] as const;

  private readonly internals: ElementInternals;

  acceptContentTypes?: Set<string>;
  file?: File;

  constructor() {
    super();

    this.internals = this.attachInternals();

    const shadow = this.attachShadow({ mode: "open", delegatesFocus: true });

    const input = document.createElement("input");
    input.name = "file";
    input.type = "file";
    input.hidden = true;
    input.addEventListener("change", this);

    const slot = document.createElement("slot");
    shadow.append(input, slot);

    this.addEventListener("click", this);
    this.addEventListener("keydown", this);
    this.addEventListener("dragover", this);
    this.addEventListener("dragleave", this);
    this.addEventListener("drop", this);
  }

  attributeChangedCallback(
    name: keyof FilePickerAttributes,
    _: string | null,
    value: string | null,
  ) {
    switch (name) {
      case "accept":
        if (value === null) {
          this.shadowRoot?.querySelector("input")?.removeAttribute("accept");
          this.acceptContentTypes = undefined;
        } else {
          this.shadowRoot?.querySelector("input")?.setAttribute("accept", value);
          this.acceptContentTypes = new Set(value.split(",").map((type) => type.trim()));
        }
        break;
    }
  }

  handleEvent(event: Event) {
    switch (event.type) {
      case "click":
        return this.handleClick(event as PointerEvent);
      case "keydown":
        return this.handleKeyDown(event as KeyboardEvent);
      case "change":
        return this.handleChange(event);
      case "dragover":
        return this.handleDragOver(event as DragEvent);
      case "dragleave":
        return this.handleDragLeave();
      case "drop":
        return this.handleDrop(event as DragEvent);
    }
  }

  private handleClick(event: PointerEvent) {
    event.stopPropagation();
    this.shadowRoot?.querySelector("input")?.click();
  }

  private handleKeyDown(event: KeyboardEvent) {
    if (event.key === "Enter") {
      event.preventDefault();
      event.stopPropagation();
      this.shadowRoot?.querySelector("input")?.click();
    }
  }

  private handleDragOver(event: DragEvent) {
    if (!event.dataTransfer) {
      return;
    }

    const item = getAcceptableDragItem(event.dataTransfer, this.acceptContentTypes);

    if (!item) {
      return;
    }

    event.stopPropagation();
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    this.internals.states.add("dragover");
  }

  private handleDragLeave() {
    this.internals.states.delete("dragover");
  }

  private handleDrop(event: DragEvent) {
    event.stopPropagation();
    event.preventDefault();

    this.internals.states.delete("dragover");

    if (!event.dataTransfer) {
      return;
    }

    const file = getAcceptableDragItem(event.dataTransfer, this.acceptContentTypes)?.getAsFile();

    if (!file) {
      return;
    }

    this.file = file;
    this.dispatchEvent(new Event("change"));
  }

  private handleChange(event: Event) {
    event.stopPropagation();

    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.item(0);

    if (!file) {
      return;
    }

    this.file = file;
    this.dispatchEvent(new Event("change"));
  }
}

customElements.define("file-picker", FilePicker);
