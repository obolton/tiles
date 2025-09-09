import { hydrateNode, render } from "./dom";
import type { Reactive } from "@/utils/reactivity";
import type { JSX } from "./jsx";

export interface EachProps<T> {
  items: Reactive<T[]>;
  children: (item: T) => JSX.Node;
  signal?: AbortSignal;
}

interface Entry {
  index: number;
  nodes: Node[];
  abort: AbortController;
}

export default class Each<T> implements JSX.ElementClass {
  readonly items: Reactive<T[]>;
  readonly renderItem: (item: T) => JSX.Node;
  readonly signal?: AbortSignal;

  private readonly entries: Map<T, Entry> = new Map();
  private anchor?: Node;

  constructor({ items, children, signal }: EachProps<T>) {
    this.items = items;
    this.renderItem = children;
    this.signal = signal;

    if (!import.meta.env.SSR) {
      this.items.subscribe(() => this.update(), signal);
    }
  }

  hydrate(container: Element, index: number) {
    if (import.meta.env.SSR) {
      throw new Error("Requires browser environment");
    }

    const items = this.items.value;
    let length = 0;
    let itemIndex = 0;

    for (const value of items) {
      const abort = new AbortController();
      const signal = this.getCombinedSignal(abort);
      const itemLength = hydrateNode(
        this.renderItem(value),
        container,
        index + length,
        signal,
      );
      const nodes: Node[] = [];
      for (let j = 0; j < itemLength; j++) {
        const node = container.childNodes[index + length + j]!;
        nodes.push(node);
      }
      this.entries.set(value, { index: itemIndex, nodes, abort });
      this.anchor ??= nodes[0];
      itemIndex++;
      length += itemLength;
    }

    if (!this.anchor) {
      this.anchor = this.createPlaceholderNode();
      container.insertBefore(this.anchor, container.childNodes[index] ?? null);
      length = 1;
    }

    return length;
  }

  render() {
    if (import.meta.env.SSR) {
      return this.items.value.map(this.renderItem);
    }

    const nodes = this.items.value.map((item, index) => {
      const abort = new AbortController();
      const signal = this.getCombinedSignal(abort);
      const node = render(this.renderItem(item), null, signal);
      const nodes = this.getNodes(node);
      this.entries.set(item, {
        index,
        nodes,
        abort,
      });
      this.anchor ??= nodes[0];
      return node;
    });

    if (!this.anchor) {
      this.anchor = this.createPlaceholderNode();
      return this.anchor;
    }

    return nodes;
  }

  private createPlaceholderNode() {
    return document.createComment("");
  }

  private getCombinedSignal(abort: AbortController) {
    return this.signal
      ? AbortSignal.any([abort.signal, this.signal])
      : abort.signal;
  }

  private getNodes(node: Node | null) {
    if (node instanceof DocumentFragment) {
      return Array.from(node.childNodes);
    }
    return node ? [node] : [];
  }

  private update() {
    if (import.meta.env.SSR) {
      throw new Error("Requires browser environment");
    }

    if (!this.anchor) {
      throw new Error("No anchor element");
    }

    if (!this.anchor.parentNode) {
      throw new Error("Anchor element is disconnected");
    }

    const container = this.anchor.parentNode;
    let referenceNode: Node | null = this.anchor ?? null;
    let index = 0;
    this.anchor = undefined;
    const remainingItems = new Set(this.entries.keys());

    for (const item of this.items.value) {
      remainingItems.delete(item);
      let position = this.entries.get(item);

      // New item
      if (!position) {
        const abort = new AbortController();
        const signal = this.getCombinedSignal(abort);
        const node = render(this.renderItem(item), null, signal);
        const nodes = this.getNodes(node);

        if (node) {
          container.insertBefore(node, referenceNode);
        }

        position = {
          index,
          nodes,
          abort,
        };
        this.entries.set(item, position);

        // Moved item
      } else if (position.index !== index) {
        position.index = index;

        for (const node of position.nodes) {
          if (node === referenceNode) {
            referenceNode = referenceNode.nextSibling;
          } else {
            container.insertBefore(node, referenceNode);
          }
        }

        // Existing node
      } else {
        referenceNode = position.nodes.at(-1)?.nextSibling ?? null;
      }

      index++;
      this.anchor ??= position.nodes[0];
    }

    if (!this.anchor) {
      this.anchor = this.createPlaceholderNode();
      container.insertBefore(this.anchor, container.childNodes[index] ?? null);
    }

    // Remove discarded items
    for (const item of remainingItems.values()) {
      const position = this.entries.get(item);

      if (position) {
        const { abort, nodes } = position;

        abort.abort();

        for (const node of nodes) {
          node.parentNode?.removeChild(node);
        }
      }

      this.entries.delete(item);
    }
  }
}
