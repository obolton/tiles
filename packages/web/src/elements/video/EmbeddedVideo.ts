import css from "./EmbeddedVideo.css?inline";
import type { GlobalHTMLAttributes } from "@/jsx/html-attributes";

const stylesheet = new CSSStyleSheet();
stylesheet.replaceSync(css);

export interface EmbeddedVideoAttributes extends GlobalHTMLAttributes {
  src: string;
  imagesrc?: string | null;
}

declare global {
  interface HTMLElementTagNameMap {
    "embedded-video": EmbeddedVideo;
  }
}

declare module "@/jsx/html-attributes" {
  interface HTMLAttributesByTagName {
    "embedded-video": EmbeddedVideoAttributes;
  }
}

export default class EmbeddedVideo extends HTMLElement {
  static readonly observedAttributes: (keyof EmbeddedVideoAttributes)[] = [
    "src",
    "imagesrc",
  ] as const;

  private placeholder?: HTMLElement;
  private iframe?: HTMLIFrameElement;
  private intersectionObserver?: IntersectionObserver;

  constructor() {
    super();

    const shadow = this.attachShadow({ mode: "open" });
    shadow.adoptedStyleSheets = [stylesheet];
  }

  connectedCallback() {
    this.showPlaceholder();

    // If the video is inside a lightbox, start playing when it's in view
    if (this.closest("[data-lightbox]")) {
      this.intersectionObserver = new IntersectionObserver(
        this.intersectionObserverCallback.bind(this),
        {
          rootMargin: "30% 0px 30% 0px",
          threshold: [1],
        },
      );
      this.intersectionObserver.observe(this);
    }
  }

  disconnectedCallback() {
    this.intersectionObserver?.disconnect();
    this.intersectionObserver = undefined;
    this.iframe?.remove();
    this.iframe = undefined;
    this.placeholder?.remove();
    this.placeholder = undefined;
  }

  attributeChangedCallback(name: keyof EmbeddedVideoAttributes, _: string, value: string) {
    switch (name) {
      case "src":
        if (this.iframe) {
          this.iframe.src = value;
        }
        break;

      case "imagesrc":
        this.placeholder?.querySelector("img")?.setAttribute("src", value);
        break;
    }
  }

  private intersectionObserverCallback(entries: IntersectionObserverEntry[]) {
    const [entry] = entries;

    if (!entry) {
      return;
    }

    if (entry.isIntersecting) {
      this.play();
    } else {
      this.stop();
    }
  }

  private showPlaceholder() {
    if (this.placeholder) {
      return;
    }

    this.placeholder = document.createElement("figure");
    this.placeholder.id = "placeholder";

    const imageSrc = this.getAttribute("imagesrc");
    if (imageSrc) {
      const image = document.createElement("img");
      image.src = imageSrc;
      image.alt = "Video thumbnail";
      this.placeholder.append(image);
    }

    this.shadowRoot?.append(this.placeholder);
  }

  private play() {
    if (this.iframe) {
      return;
    }

    const src = this.getAttribute("src");
    if (!src) {
      throw new Error("No video URL");
    }

    this.iframe = document.createElement("iframe");
    this.iframe.referrerPolicy = "no-referrer";
    this.iframe.allow = "autoplay; fullscreen";
    this.iframe.src = src;
    this.iframe.addEventListener(
      "load",
      () => {
        this.placeholder?.remove();
        this.placeholder = undefined;
      },
      { once: true },
    );
    this.shadowRoot?.append(this.iframe);
  }

  private stop() {
    this.iframe?.remove();
    this.iframe = undefined;
    this.showPlaceholder();
  }
}

customElements.define("embedded-video", EmbeddedVideo);
