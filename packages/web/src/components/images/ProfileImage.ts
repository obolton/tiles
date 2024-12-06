export default class ProfileImage extends HTMLElement {
  static observedAttributes = ["src", "name"] as const;

  private shadow: ShadowRoot;
  private image?: HTMLImageElement;
  private placeholder?: HTMLElement;

  constructor() {
    super();

    this.shadow = this.attachShadow({ mode: "closed" });
  }

  connectedCallback() {
    this.update();
  }

  attributeChangedCallback(
    name: (typeof ProfileImage.observedAttributes)[number],
  ) {
    switch (name) {
      case "src":
      case "name":
        this.update();
        break;
    }
  }

  private update() {
    const src = this.getAttribute("src");
    const name = this.getAttribute("name") ?? "";

    if (src) {
      this.placeholder?.remove();
      this.placeholder = undefined;

      if (this.image) {
        this.image.setAttribute("src", src);
        this.image.setAttribute("alt", `Profile image for ${name}`);
        this.image.setAttribute("title", name);
      } else {
        this.image = document.createElement("img");
        this.image.setAttribute("part", "image");
        this.image.setAttribute("src", src);
        this.image.setAttribute("alt", `Profile image for ${name}`);
        this.image.setAttribute("title", name);
        this.image.addEventListener("load", () =>
          this.dispatchEvent(new Event("load", { bubbles: false })),
        );
        this.shadow.append(this.image);
      }
    } else {
      this.image?.remove();
      this.image = undefined;

      if (this.placeholder) {
        this.placeholder.textContent = name.charAt(0);
      } else {
        this.placeholder = document.createElement("abbr");
        this.placeholder.setAttribute("part", "placeholder");
        this.placeholder.setAttribute("title", name);
        this.placeholder.textContent = name.charAt(0);
        this.shadow.append(this.placeholder);
      }
    }
  }
}
