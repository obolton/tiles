import { uploadMedia } from "@/utils/media";
import { handleError } from "@/utils/errors";
import css from "./FilePicker.css?inline";

const stylesheet = new CSSStyleSheet();
stylesheet.replaceSync(css);

export class FilePickerEvent extends Event {
  constructor(
    type: "change" | "upload" | "error",
    readonly uploadKey?: string,
  ) {
    super(type, { bubbles: false, cancelable: false });
  }
}

export default class FilePicker extends HTMLElement {
  static observedAttributes = ["accept"] as const;

  constructor() {
    super();

    const shadow = this.attachShadow({ mode: "closed" });
    shadow.adoptedStyleSheets = [stylesheet];

    const label = document.createElement("label");

    const input = document.createElement("input");
    input.setAttribute("name", "file");
    input.setAttribute("type", "file");
    input.setAttribute("hidden", "");
    input.addEventListener("change", this.handleChange.bind(this));

    const slot = document.createElement("slot");

    label.append(input, slot);

    shadow.appendChild(label);
  }

  attributeChangedCallback(
    name: (typeof FilePicker.observedAttributes)[number],
    _: string,
    value: string,
  ) {
    switch (name) {
      case "accept":
        this.shadowRoot?.querySelector("input")?.setAttribute("accept", value);
        break;
    }
  }

  private getMediaType() {
    const type = this.getAttribute("type");
    if (type !== "image" && type !== "profile-image") {
      throw new Error(`Invalid media type: ${type}`);
    }
    return type;
  }

  async handleChange(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.item(0);

    if (!file) {
      return;
    }

    this.dispatchEvent(new FilePickerEvent("change"));

    try {
      const key = await uploadMedia(file, this.getMediaType());
      this.dispatchEvent(new FilePickerEvent("upload", key));
    } catch (error) {
      if (error instanceof Error) {
        handleError(error);
      }
      this.dispatchEvent(new FilePickerEvent("error"));
    }
  }
}
