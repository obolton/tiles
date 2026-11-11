import css from "./InfiniteScroll.css?inline";

const stylesheet = new CSSStyleSheet();
stylesheet.replaceSync(css);

export interface InfiniteScrollEventMap {
  loadmore: Event;
}

declare global {
  interface HTMLElementTagNameMap {
    "infinite-scroll": InfiniteScroll;
  }
  interface HTMLElementEventMap extends InfiniteScrollEventMap {}
}

export default class InfiniteScroll extends HTMLElement {
  public atEnd = false;
  private sentinel: HTMLElement;
  private intersectionObserver: IntersectionObserver;

  constructor() {
    super();

    const shadow = this.attachShadow({ mode: "closed" });
    shadow.adoptedStyleSheets = [stylesheet];

    const slot = document.createElement("slot");
    this.sentinel = document.createElement("div");
    this.sentinel.id = "sentinel";
    this.sentinel.ariaHidden = "true";

    shadow.append(slot, this.sentinel);

    this.intersectionObserver = new IntersectionObserver(
      this.intersectionObserverCallback.bind(this),
      { threshold: 0 },
    );
  }

  connectedCallback() {
    this.intersectionObserver.observe(this.sentinel);
  }

  disconnectedCallback() {
    this.intersectionObserver.disconnect();
  }

  private intersectionObserverCallback(entries: IntersectionObserverEntry[]) {
    const [entry] = entries;
    if (!entry) {
      return;
    }

    this.atEnd = entry.isIntersecting;

    if (this.atEnd) {
      this.dispatchEvent(new Event("loadmore"));
    }
  }
}

customElements.define("infinite-scroll", InfiniteScroll);
