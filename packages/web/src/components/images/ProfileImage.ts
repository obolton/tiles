import { setSearchParams } from "@/utils/urls";

export interface ProfileImageAttributes {
  name: string;
  src?: string;
  size?: "small" | "large";
}

export default class ProfileImage extends HTMLElement {
  static readonly observedAttributes: (keyof ProfileImageAttributes)[] = [
    "src",
    "name",
    "size",
  ] as const;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  attributeChangedCallback() {
    this.update();
  }

  get src() {
    return this.getAttribute("src");
  }

  set src(value: string | null) {
    if (value) {
      this.setAttribute("src", value);
    } else {
      this.removeAttribute("src");
    }
  }

  get name() {
    return this.getAttribute("name") ?? "";
  }

  set name(value: string) {
    this.setAttribute("name", value);
  }

  get size() {
    const value = this.getAttribute("size");
    switch (value) {
      case "small":
      case "large":
        return value;
      default:
        return "small";
    }
  }

  set size(value: NonNullable<ProfileImageAttributes["size"]>) {
    if (value) {
      this.setAttribute("size", value);
    } else {
      this.removeAttribute("size");
    }
  }

  private update() {
    const src = this.src;
    const name = this.name;
    const size = this.size;

    if (src) {
      this.shadowRoot?.querySelector("abbr")?.remove();

      const image = this.shadowRoot?.querySelector("img");
      if (image) {
        image.src = setSearchParams(src, { class: size });
        image.alt = `Profile image for ${name}`;
        image.title = name;
      } else {
        const image = document.createElement("img");
        image.setAttribute("part", "image");
        image.src = setSearchParams(src, { class: size });
        image.alt = `Profile image for ${name}`;
        image.title = name;
        image.addEventListener("load", () =>
          this.dispatchEvent(new Event("load", { bubbles: false })),
        );
        this.shadowRoot?.append(image);
      }
    } else {
      this.shadowRoot?.querySelector("img")?.remove();
      const placeholder = this.shadowRoot?.querySelector("abbr");

      if (placeholder) {
        placeholder.textContent = name.charAt(0);
      } else {
        const placeholder = document.createElement("abbr");
        placeholder.setAttribute("part", "placeholder");
        placeholder.title = name;
        placeholder.textContent = name.charAt(0);
        this.shadowRoot?.append(placeholder);
      }
    }
  }
}
