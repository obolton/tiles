import { uploadMedia } from "@/utils/media";
import css from "./FilePicker.css?inline";

const stylesheet = new CSSStyleSheet();
stylesheet.replaceSync(css);

export interface FilePickerEventInit extends EventInit {
  file?: File;
  uploadKey?: string;
}

export class FilePickerEvent extends Event {
  file?: File;
  uploadKey?: string;

  constructor(type: "change" | "upload", options: FilePickerEventInit) {
    const { file, uploadKey, ...init } = options;
    super(type, init);

    this.file = file;
    this.uploadKey = uploadKey;
  }
}

export interface FilePickerAttributes {
  accept?: string;
}

export default class FilePicker extends HTMLElement {
  static observedAttributes: (keyof FilePickerAttributes)[] = [
    "accept",
  ] as const;

  constructor() {
    super();

    const shadow = this.attachShadow({ mode: "open" });
    shadow.adoptedStyleSheets = [stylesheet];

    const label = document.createElement("label");

    const input = document.createElement("input");
    input.name = "file";
    input.type = "file";
    input.hidden = true;
    input.addEventListener("change", this.handleChange.bind(this));

    const slot = document.createElement("slot");
    label.append(input, slot);

    shadow.appendChild(label);
  }

  attributeChangedCallback(
    name: keyof FilePickerAttributes,
    _: string,
    value: string | null,
  ) {
    switch (name) {
      case "accept":
        if (value === null) {
          this.shadowRoot?.querySelector("input")?.removeAttribute("accept");
        } else {
          this.shadowRoot
            ?.querySelector("input")
            ?.setAttribute("accept", value);
        }
        break;
    }
  }

  get files() {
    return this.shadowRoot?.querySelector("input")?.files;
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

    const allowUpload = this.dispatchEvent(
      new FilePickerEvent("change", { bubbles: true, cancelable: true, file }),
    );
    if (!allowUpload) {
      return;
    }

    try {
      const key = await uploadMedia(file, this.getMediaType());
      this.dispatchEvent(
        new FilePickerEvent("upload", {
          bubbles: true,
          cancelable: false,
          file,
          uploadKey: key,
        }),
      );
    } catch (error) {
      this.dispatchEvent(
        new ErrorEvent("error", {
          bubbles: true,
          cancelable: false,
          error,
        }),
      );
    }
  }
}
