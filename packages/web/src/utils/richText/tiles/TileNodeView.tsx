import { NodeSelection } from "prosemirror-state";
import { render } from "jsx/dom";
import { reactive } from "reactivity";
import { TILE_NODE } from "doc/richText/tiles";
import EmbeddedTile from "@/components/item/EmbeddedTile";
import { exitNode, insertParagraphAfter } from "@/utils/richText/navigation";
import type * as Y from "yjs";
import type { Node } from "prosemirror-model";
import type { EditorView, NodeView } from "prosemirror-view";
import type Body from "@/models/Body";
import type Tile from "@/models/Tile";

/**
 * Renders an embedded tile with the regular tile components. The tile is an island: ProseMirror
 * ignores events and DOM changes inside it, so nested editors, tables and maps work as usual.
 */
export default class TileNodeView implements NodeView, EventListenerObject {
  readonly dom: HTMLElement;
  readonly id: string;

  private readonly view: EditorView;
  private readonly getPos: () => number | undefined;
  private readonly body: Body;
  private readonly registry: Map<string, TileNodeView>;
  private readonly tile = reactive<Tile | null>(null);
  private readonly abort = new AbortController();

  constructor(
    node: Node,
    view: EditorView,
    getPos: () => number | undefined,
    body: Body,
    registry: Map<string, TileNodeView>,
  ) {
    this.id = node.attrs.id as string;
    this.view = view;
    this.getPos = getPos;
    this.body = body;
    this.registry = registry;

    const [dom] = render(<EmbeddedTile tile={this.tile} tabindex={0} />, {
      signal: this.abort.signal,
    });
    if (!(dom instanceof HTMLElement)) {
      throw new Error("Embedded tile did not render");
    }
    this.dom = dom;
    this.dom.dataset.tileId = this.id;
    this.dom.addEventListener("keydown", this);

    this.mount();
    registry.set(this.id, this);
  }

  get mounted(): boolean {
    return this.tile.value !== null;
  }

  /** Resolves the tile, constructing its model from the map if it is not indexed yet. */
  mount() {
    const { page } = this.body;
    const map = page.doc.getMap<Y.Map<unknown>>("tiles").get(this.id);
    this.tile.value = page.index.get(this.id) ?? (map ? page.add(map) : null);
  }

  update(node: Node): boolean {
    return node.type.name === TILE_NODE && node.attrs.id === this.id;
  }

  // Selection is shown through the item's aria-selected state, and ProseMirror's default would
  // make the node draggable while selected.
  selectNode() {}

  deselectNode() {}

  stopEvent() {
    return true;
  }

  ignoreMutation() {
    return true;
  }

  destroy() {
    this.abort.abort();
    this.registry.delete(this.id);
  }

  handleEvent(event: Event) {
    if (event.type === "keydown") {
      this.onKeyDown(event as KeyboardEvent);
    }
  }

  private onKeyDown(event: KeyboardEvent) {
    const pos = this.getPos();
    if (pos === undefined) {
      return;
    }

    // Step out of the tile from anywhere inside it; nested editors prevent Escape's default
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      this.select(pos);
      return;
    }

    // Keys on the item itself move on; nested editors keep their own keys
    const target = event.target;
    if (event.defaultPrevented || !(target instanceof Element) || target.tagName !== "PAGE-ITEM") {
      return;
    }

    switch (event.key) {
      case "ArrowUp":
        exitNode(this.view, pos, -1);
        break;
      case "ArrowDown":
        exitNode(this.view, pos, 1);
        break;
      case "Enter":
        insertParagraphAfter(this.view, pos);
        break;
      default:
        return;
    }
    event.preventDefault();
    event.stopPropagation();
  }

  private select(pos: number) {
    const { state } = this.view;
    this.view.dispatch(state.tr.setSelection(NodeSelection.create(state.doc, pos)));
    this.view.focus();
  }
}
