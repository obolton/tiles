export interface InfiniteScrollAttributes {
  onloadmore: (event: globalThis.Event) => void;
}

export default class InfiniteScroll extends HTMLElement {
  public atEnd = false;
  private sentinel: HTMLElement;
  private intersectionObserver: IntersectionObserver | null = null;

  constructor() {
    super();

    const shadow = this.attachShadow({ mode: "closed" });
    const slot = document.createElement("slot");
    this.sentinel = document.createElement("div");
    this.sentinel.ariaHidden = "true";

    shadow.append(slot, this.sentinel);
  }

  connectedCallback() {
    this.intersectionObserver = new IntersectionObserver(
      this.intersectionObserverCallback.bind(this),
      { threshold: 1 },
    );
    this.intersectionObserver.observe(this.sentinel);
  }

  disconnectedCallback() {
    this.intersectionObserver?.disconnect();
    this.intersectionObserver = null;
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
