import type { MessageEvent } from "./types";
import type { RichTextFormat, RichTextNode } from "doc/richText/events";

function isListElement(
  el: Element | null,
): el is HTMLUListElement | HTMLOListElement {
  return el?.tagName === "UL" || el?.tagName === "OL";
}

export default class StreamRenderer {
  readonly container: HTMLElement;
  private currentBlock: HTMLElement | null = null;
  private bold = false;
  private italic = false;

  constructor() {
    this.container = document.createElement("div");
    this.container.style.display = "contents";
  }

  append(event: MessageEvent): void {
    if (typeof event === "string") {
      this.appendText(event);
    } else if ("type" in event) {
      this.appendNode(event);
    } else {
      this.applyFormat(event);
    }
  }

  private appendText(text: string): void {
    if (!this.currentBlock) {
      this.appendParagraph();
    }
    this.currentBlock!.appendChild(this.createFormattedNode(text));
  }

  private createFormattedNode(text: string): Node {
    let node: Node = document.createTextNode(text);
    if (this.italic) {
      const em = document.createElement("em");
      em.appendChild(node);
      node = em;
    }
    if (this.bold) {
      const strong = document.createElement("strong");
      strong.appendChild(node);
      node = strong;
    }
    return node;
  }

  private appendNode(node: RichTextNode): void {
    switch (node.type) {
      case "paragraph":
        this.appendParagraph();
        break;
      case "heading":
        this.appendHeading(node.level);
        break;
      case "listitem":
        this.appendListItem(node.listType, node.depth);
        break;
      case "divider":
        this.appendDivider();
        break;
      case "code":
        this.appendCode(node.language);
        break;
    }
  }

  private applyFormat(format: RichTextFormat): void {
    if (format.bold !== undefined) {
      this.bold = format.bold;
    }
    if (format.italic !== undefined) {
      this.italic = format.italic;
    }
  }

  private appendParagraph(): void {
    this.currentBlock = document.createElement("p");
    this.container.appendChild(this.currentBlock);
  }

  private appendHeading(level: number): void {
    const tag = `h${Math.min(level, 3)}` as "h1" | "h2" | "h3";
    this.currentBlock = document.createElement(tag);
    this.container.appendChild(this.currentBlock);
  }

  private appendListItem(
    listType: "ordered" | "unordered",
    depth: number,
  ): void {
    const tag = listType === "ordered" ? "ol" : "ul";
    const activeList = this.getActiveList();

    if (!activeList) {
      const list = document.createElement(tag);
      this.container.appendChild(list);
      this.currentBlock = list.appendChild(document.createElement("li"));
      return;
    }

    const currentDepth = this.getListDepth(activeList);

    if (depth > currentDepth) {
      const nested = document.createElement(tag);
      this.currentBlock!.appendChild(nested);
      this.currentBlock = nested.appendChild(document.createElement("li"));
    } else if (depth < currentDepth) {
      let list: HTMLElement = activeList;
      let d = currentDepth;
      while (d > depth) {
        const parent = list.parentElement?.parentElement;
        if (parent instanceof HTMLElement && isListElement(parent)) {
          list = parent;
          d--;
        } else {
          break;
        }
      }
      this.currentBlock = list.appendChild(document.createElement("li"));
    } else if (activeList.tagName !== tag.toUpperCase()) {
      const list = document.createElement(tag);
      this.container.appendChild(list);
      this.currentBlock = list.appendChild(document.createElement("li"));
    } else {
      this.currentBlock = activeList.appendChild(document.createElement("li"));
    }
  }

  private getActiveList(): HTMLElement | null {
    const parent = this.currentBlock?.parentElement;
    return parent && isListElement(parent) ? parent : null;
  }

  private getListDepth(list: HTMLElement): number {
    let depth = 0;
    let el: Element | null = list.parentElement;
    while (el && el !== this.container) {
      if (isListElement(el)) {
        depth++;
      }
      el = el.parentElement;
    }
    return depth;
  }

  private appendDivider(): void {
    this.container.appendChild(document.createElement("hr"));
    this.currentBlock = null;
  }

  private appendCode(language: string): void {
    const pre = document.createElement("pre");
    const code = document.createElement("code");
    if (language) {
      code.dataset.language = language;
    }
    pre.appendChild(code);
    this.container.appendChild(pre);
    this.currentBlock = code;
  }
}
