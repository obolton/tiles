import PopOut from "@/elements/pop-out/PopOut";
import type { PopOutAttributes } from "@/elements/pop-out/PopOut";
import type { DragDropEvent } from "@/utils/drag";

const TOGGLE_DELAY = 500;

export type StackViewAttributes = PopOutAttributes;

declare global {
  interface HTMLElementTagNameMap {
    "stack-view": StackView;
  }
}

declare module "@/jsx/html-attributes" {
  interface HTMLAttributesByTagName {
    "stack-view": StackViewAttributes;
  }
}

export default class StackView extends PopOut {
  private toggleTimeout?: ReturnType<typeof setTimeout>;

  constructor() {
    super();

    this.addEventListener("dnd-dragenter", this);
    this.addEventListener("dnd-dragleave", this);
    this.addEventListener("dnd-dragover", this);
  }

  protected get isOverflowing() {
    return true;
  }

  handleEvent(event: Event) {
    super.handleEvent(event);

    switch (event.type) {
      case "dnd-dragenter":
        return this.handleDragEnter(event as DragDropEvent);
      case "dnd-dragleave":
        return this.handleDragLeave(event as DragDropEvent);
      case "dnd-dragover":
        return this.handleDragOver(event as DragDropEvent);
    }
  }

  private handleDragEnter(event: DragDropEvent) {
    if (this.isOpen) {
      event.stopPropagation();
      return;
    }

    // Move the drag preview back to the top of the top layer
    const dragPreview = document.getElementById("drag-preview");
    this.toggleTimeout ??= setTimeout(() => {
      this.addEventListener(
        "toggle",
        () => {
          dragPreview?.hidePopover();
          dragPreview?.showPopover();
        },
        { once: true },
      );
      this.open();
      this.toggleTimeout = undefined;
    }, TOGGLE_DELAY);
  }

  private handleDragLeave(event: DragDropEvent) {
    if (this.isOpen) {
      event.stopPropagation();
      return;
    }

    clearTimeout(this.toggleTimeout);
    this.toggleTimeout = undefined;
  }

  private handleDragOver(event: DragDropEvent) {
    if (!this.isOpen) {
      return;
    }

    event.stopPropagation();

    const bounds = this.contents.getBoundingClientRect();
    if (
      event.clientX < bounds.left ||
      event.clientY < bounds.top ||
      event.clientX > bounds.right ||
      event.clientY > bounds.bottom
    ) {
      this.toggleTimeout ??= setTimeout(() => {
        this.close();
        this.toggleTimeout = undefined;
      }, TOGGLE_DELAY);
    } else {
      clearTimeout(this.toggleTimeout);
      this.toggleTimeout = undefined;
    }
  }
}

customElements.define("stack-view", StackView);
