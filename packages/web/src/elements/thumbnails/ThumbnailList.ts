import "./ThumbnailList.css";
import { ThumbnailListEvent } from "./events";
import { getDragPosition } from "@/utils/drag-placeholder";
import { moveBefore } from "jsx/move-before";
import { makeDraggable, type DragDropEvent } from "@/utils/drag";
import type { GlobalHTMLAttributes } from "jsx/html-attributes";

const ACTIVE_THRESHOLD = 0.5;

type Orientation = "horizontal" | "vertical";

export interface ThumbnailListAttributes extends GlobalHTMLAttributes {
  allowdrag?: boolean;
}

declare global {
  interface HTMLElementTagNameMap {
    "thumbnail-list": ThumbnailList;
  }
}

declare module "jsx/html-attributes" {
  interface HTMLAttributesByTagName {
    "thumbnail-list": ThumbnailListAttributes;
  }
}

export default class ThumbnailList extends HTMLElement {
  static readonly observedAttributes: (keyof ThumbnailListAttributes)[] = ["allowdrag"] as const;

  private internals: ElementInternals;
  private abortController?: AbortController;
  private intersectionObserver?: IntersectionObserver;
  private mutationObserver?: MutationObserver;
  private resizeObserver?: ResizeObserver;
  private dragController?: AbortController;
  private dragPlaceholder: HTMLElement | null = null;
  private beforeId: string | null = null;
  private jumpingTo: HTMLElement | null = null;

  constructor() {
    super();
    this.internals = this.attachInternals();
    this.internals.role = "listbox";
  }

  connectedCallback() {
    this.abortController = new AbortController();
    const { signal } = this.abortController;

    this.intersectionObserver = new IntersectionObserver(
      (entries) => this.handleIntersect(entries),
      { threshold: ACTIVE_THRESHOLD },
    );
    this.mutationObserver = new MutationObserver(() => this.syncObservations());
    this.mutationObserver.observe(this, { childList: true });
    // The list flows horizontally or vertically depending on its layout
    this.resizeObserver = new ResizeObserver(() => this.syncOrientation());
    this.resizeObserver.observe(this);

    this.addEventListener("click", this, { signal });

    // Defer initial sync so sibling <main>'s <page-item>s are also in the DOM
    queueMicrotask(() => {
      this.syncOrientation();
      this.syncObservations();
    });
  }

  disconnectedCallback() {
    this.abortController?.abort();
    this.abortController = undefined;
    this.intersectionObserver?.disconnect();
    this.mutationObserver?.disconnect();
    this.resizeObserver?.disconnect();
    this.intersectionObserver = undefined;
    this.mutationObserver = undefined;
    this.resizeObserver = undefined;
    this.ariaActiveDescendantElement = null;
    this.detachDrag();
  }

  /** Reads the orientation from the layout so it follows the stylesheet's breakpoints. */
  get orientation(): Orientation {
    return getComputedStyle(this).flexDirection.startsWith("row") ? "horizontal" : "vertical";
  }

  private syncOrientation() {
    const orientation = this.orientation;
    if (this.dataset.orientation === orientation) {
      return;
    }
    this.dataset.orientation = orientation;
    this.internals.ariaOrientation = orientation;
    // Drag constraints are fixed when attached, so reattach for the new axis
    if (this.dragController) {
      this.detachDrag();
      this.attachDrag();
    }
  }

  attributeChangedCallback(name: string, _oldValue: string | null, newValue: string | null) {
    if (name === "allowdrag") {
      if (newValue !== null) {
        this.attachDrag();
      } else {
        this.detachDrag();
      }
    }
  }

  handleEvent(event: Event) {
    switch (event.type) {
      case "click":
        return this.handleClick(event);
      case "dnd-dragenter":
        return this.handleDragEnter(event as DragDropEvent);
      case "dnd-dragover":
        return this.handleDragOver(event as DragDropEvent);
      case "dnd-dragleave":
        return this.handleDragLeave();
      case "dnd-drop":
        return this.handleDrop(event as DragDropEvent);
      case "dnd-dragend":
        return this.handleDragEnd();
    }
  }

  private handleClick(event: Event) {
    if (!(event.target instanceof Element)) {
      return;
    }

    const thumb = event.target.closest<HTMLElement>('[role="option"]');
    if (!thumb || !this.contains(thumb)) {
      return;
    }

    const slideId = thumb.getAttribute("aria-controls");
    if (slideId) {
      this.jumpTo(slideId);
    }
  }

  private jumpTo(slideId: string) {
    const slide = document.getElementById(slideId);
    if (!slide) {
      return;
    }

    this.jumpingTo = slide;
    this.setActive(slideId);
    slide.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  private handleIntersect(entries: IntersectionObserverEntry[]) {
    for (const entry of entries) {
      if (!entry.isIntersecting || entry.intersectionRatio <= ACTIVE_THRESHOLD) {
        continue;
      }

      if (!(entry.target instanceof HTMLElement)) {
        continue;
      }

      // Suspend scroll-driven active updates during a programmatic jump
      if (this.jumpingTo) {
        if (entry.target === this.jumpingTo) {
          this.jumpingTo = null;
        }
        continue;
      }

      this.setActive(entry.target.id);
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

    if (this.jumpingTo && !this.jumpingTo.isConnected) {
      this.jumpingTo = null;
    }

    this.enableDrag();
  }

  private setActive(slideId: string | null) {
    const prev = this.ariaActiveDescendantElement;
    const prevId = prev?.getAttribute("aria-controls") ?? null;

    if (slideId === prevId) {
      return;
    }

    if (prev) {
      prev.ariaSelected = "false";
    }

    if (!slideId) {
      this.ariaActiveDescendantElement = null;
      return;
    }

    const next = this.querySelector<HTMLElement>(`[aria-controls="${CSS.escape(slideId)}"]`);

    if (next) {
      next.ariaSelected = "true";
      this.ariaActiveDescendantElement = next;
      next.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
      this.dispatchEvent(new ThumbnailListEvent("slideselect", { slideId }));
    } else {
      this.ariaActiveDescendantElement = null;
    }
  }

  private attachDrag() {
    if (this.dragController) {
      return;
    }
    this.dragController = new AbortController();
    const { signal } = this.dragController;

    this.dataset.drop = "true";
    this.addEventListener("dnd-dragenter", this, { signal });
    this.addEventListener("dnd-dragover", this, { signal });
    this.addEventListener("dnd-dragleave", this, { signal });
    this.addEventListener("dnd-drop", this, { signal });
    this.addEventListener("dnd-dragend", this, { signal });

    this.enableDrag();
  }

  private detachDrag() {
    this.dragController?.abort();
    this.dragController = undefined;
    delete this.dataset.drop;
    this.hidePlaceholder();
    this.beforeId = null;
  }

  private enableDrag() {
    if (!this.dragController) {
      return;
    }

    const { signal } = this.dragController;
    const constrain = this.orientation;

    for (const slide of this.querySelectorAll<HTMLElement>('[role="option"]')) {
      makeDraggable(slide, { signal, constrain });
    }
  }

  private handleDragEnter(event: DragDropEvent) {
    if (!this.contains(event.state.element)) {
      return;
    }

    this.showPlaceholder();
  }

  private handleDragOver(event: DragDropEvent) {
    event.stopPropagation();

    if (!this.contains(event.state.element)) {
      return;
    }

    if (!this.dragPlaceholder) {
      return;
    }

    const placeholder = this.dragPlaceholder;
    const dragged = event.state.element;

    const position = getDragPosition(
      this,
      event.clientX,
      event.clientY,
      this.orientation,
      (el) => el !== placeholder && el !== dragged,
    );

    if (position) {
      this.beforeId = position.next?.getAttribute("aria-controls") ?? null;
      moveBefore(this, placeholder, position.next);
    }
  }

  private handleDragLeave() {
    this.hidePlaceholder();
    this.beforeId = null;
  }

  private handleDrop(event: DragDropEvent) {
    event.preventDefault();
    event.stopPropagation();

    if (!this.contains(event.state.element)) {
      return;
    }

    const slideId = event.state.element.getAttribute("aria-controls");
    if (!slideId) {
      return;
    }

    this.dispatchEvent(
      new ThumbnailListEvent("slidereorder", {
        slideId,
        beforeId: this.beforeId,
      }),
    );
  }

  private handleDragEnd() {
    this.hidePlaceholder();
    this.beforeId = null;
  }

  private showPlaceholder() {
    if (this.dragPlaceholder) {
      return;
    }

    const element = document.createElement("div");
    element.className = "drop-indicator";
    this.appendChild(element);
    this.dragPlaceholder = element;
  }

  private hidePlaceholder() {
    this.dragPlaceholder?.remove();
    this.dragPlaceholder = null;
  }
}

customElements.define("thumbnail-list", ThumbnailList);
