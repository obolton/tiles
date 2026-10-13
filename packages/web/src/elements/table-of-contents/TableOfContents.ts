import AnchoredPopover from "@/elements/anchored-popover/AnchoredPopover";
import type { AnchoredPopoverAttributes } from "@/elements/anchored-popover/AnchoredPopover";

export type TableOfContentsAttributes = AnchoredPopoverAttributes;

declare global {
  interface HTMLElementTagNameMap {
    "table-of-contents": TableOfContents;
  }
}

declare module "@/jsx/html-attributes" {
  interface HTMLAttributesByTagName {
    "table-of-contents": TableOfContentsAttributes;
  }
}

export default class TableOfContents extends AnchoredPopover {
  constructor() {
    super();
    this.addEventListener("beforetoggle", this);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.clear();
  }

  handleEvent(event: Event) {
    super.handleEvent(event);

    switch (event.type) {
      case "beforetoggle":
        return this.handleBeforeToggle(event as ToggleEvent);
    }
  }

  protected handleBeforeToggle(event: ToggleEvent) {
    super.handleBeforeToggle(event);
    if (event.newState === "open") {
      this.update();
    }
  }

  protected handleToggle(event: ToggleEvent) {
    super.handleToggle(event);

    if (event.newState === "closed") {
      void Promise.allSettled(this.getAnimations().map((animation) => animation.finished)).then(
        () => this.clear(),
      );
    }
  }

  private getDocumentHeadings() {
    return document.body.querySelectorAll("h1, h2, h3, [data-heading]");
  }

  private getHeadingLevel(element: Element) {
    switch (element.tagName) {
      case "H1":
        return "h1";
      case "H2":
        return "h2";
      case "H3":
        return "h3";
      default:
        return element.getAttribute("data-heading") || "h1";
    }
  }

  update() {
    const menu = document.createElement("menu");

    const headings = this.getDocumentHeadings();

    for (const heading of headings) {
      const item = document.createElement("li");

      const link = document.createElement("a");
      link.classList.add(this.getHeadingLevel(heading));
      link.textContent = heading.textContent || "Untitled section";
      link.href = `#${heading.id || heading.closest("[id]")?.id || ""}`;

      item.appendChild(link);
      item.addEventListener("click", (event) => {
        event.preventDefault();
        heading.scrollIntoView({ behavior: "smooth" });
        heading.animate(
          [
            {
              offset: 0,
              borderRadius: "var(--border-radius)",
            },
            {
              offset: 0.2,
              borderRadius: "var(--border-radius)",
              backgroundColor: "var(--highlight-color)",
              boxShadow: "0 0 0 2px var(--highlight-color)",
            },
            {
              offset: 0.8,
              borderRadius: "var(--border-radius)",
              backgroundColor: "var(--highlight-color)",
              boxShadow: "0 0 0 2px var(--highlight-color)",
            },
            {
              offset: 1,
              borderRadius: "var(--border-radius)",
            },
          ],
          { duration: 1500, easing: "ease" },
        );
      });

      menu.appendChild(item);
    }

    this.replaceChildren(menu);
  }

  clear() {
    this.replaceChildren();
  }
}

customElements.define("table-of-contents", TableOfContents);
