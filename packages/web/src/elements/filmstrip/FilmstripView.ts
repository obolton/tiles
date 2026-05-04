const ACTIVE_THRESHOLD = 0.5;

declare global {
  interface HTMLElementTagNameMap {
    "filmstrip-view": FilmstripView;
  }
}

export default class FilmstripView extends HTMLElement {
  private internals: ElementInternals;
  private intersectionObserver?: IntersectionObserver;
  private mutationObserver?: MutationObserver;

  constructor() {
    super();
    this.internals = this.attachInternals();
    this.internals.role = "listbox";
  }

  connectedCallback() {
    this.tabIndex = 0;

    this.intersectionObserver = new IntersectionObserver(
      (entries) => this.handleIntersect(entries),
      { threshold: ACTIVE_THRESHOLD },
    );
    this.mutationObserver = new MutationObserver(() => this.syncObservations());
    this.mutationObserver.observe(this, { childList: true });

    this.addEventListener("click", this);

    // Defer initial sync so sibling <main>'s <page-item>s are also in the DOM
    queueMicrotask(() => this.syncObservations());
  }

  disconnectedCallback() {
    this.intersectionObserver?.disconnect();
    this.mutationObserver?.disconnect();
    this.removeEventListener("click", this);
    this.intersectionObserver = undefined;
    this.mutationObserver = undefined;
    this.ariaActiveDescendantElement = null;
  }

  handleEvent(event: Event) {
    if (event.type === "click") {
      this.handleClick(event);
    }
  }

  private handleClick(event: Event) {
    if (!(event.target instanceof Element)) {
      return;
    }

    const thumb = event.target.closest<HTMLElement>("[aria-controls]");
    if (!thumb || !this.contains(thumb)) {
      return;
    }

    const tileId = thumb.getAttribute("aria-controls");
    if (tileId) {
      this.jumpTo(tileId);
    }
  }

  private jumpTo(tileId: string) {
    const slide = document.getElementById(tileId);
    if (!slide) {
      return;
    }

    this.setActive(tileId);
    slide.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  private handleIntersect(entries: IntersectionObserverEntry[]) {
    for (const entry of entries) {
      if (
        !entry.isIntersecting ||
        entry.intersectionRatio <= ACTIVE_THRESHOLD
      ) {
        continue;
      }

      if (entry.target instanceof HTMLElement) {
        this.setActive(entry.target.id);
      }
    }
  }

  private syncObservations() {
    this.intersectionObserver?.disconnect();
    for (const thumb of this.querySelectorAll<HTMLElement>("[aria-controls]")) {
      const id = thumb.getAttribute("aria-controls");
      const slide = id ? document.getElementById(id) : null;
      if (slide) {
        this.intersectionObserver?.observe(slide);
      }
    }

    const active = this.ariaActiveDescendantElement;
    if (active && !this.contains(active)) {
      this.setActive(null);
    }
  }

  private setActive(tileId: string | null) {
    const prev = this.ariaActiveDescendantElement;
    const prevId = prev?.getAttribute("aria-controls") ?? null;

    if (tileId === prevId) {
      return;
    }

    if (prev) {
      prev.ariaSelected = "false";
    }

    if (!tileId) {
      this.ariaActiveDescendantElement = null;
      return;
    }

    const next = this.querySelector<HTMLElement>(
      `[aria-controls="${CSS.escape(tileId)}"]`,
    );

    if (next) {
      next.ariaSelected = "true";
      this.ariaActiveDescendantElement = next;
      next.scrollIntoView({ block: "nearest", behavior: "smooth" });
    } else {
      this.ariaActiveDescendantElement = null;
    }
  }
}

customElements.define("filmstrip-view", FilmstripView);
