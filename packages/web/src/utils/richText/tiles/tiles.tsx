import { NodeSelection, Plugin, PluginKey } from "prosemirror-state";
import { Fragment, Slice } from "prosemirror-model";
import { ySyncPluginKey } from "y-prosemirror";
import { last } from "@/utils/iterables";
import { toRelativePosition } from "@/utils/richText/selection";
import { schema } from "@/utils/richText/schema";
import TileNodeView from "./TileNodeView";
import type * as Y from "yjs";
import type { Node } from "prosemirror-model";
import type { EditorState } from "prosemirror-state";
import type { EditorView } from "prosemirror-view";
import type Body from "@/models/Body";

export interface TilesOptions {
  /** The body whose tiles the editor embeds. Without it the editor refuses tile nodes. */
  body?: Body;
}

interface TilesState {
  ids: Set<string>;
  /** Tiles whose nodes this transaction removed and whose maps should be deleted. */
  removed: string[];
}

export const TILES_PLUGIN_KEY = new PluginKey<TilesState>("tiles");

function isTile(node: Node): boolean {
  return node.type === schema.nodes.tile;
}

function tileIds(doc: Node): Set<string> {
  const ids = new Set<string>();
  doc.descendants((node) => {
    if (isTile(node)) {
      ids.add(node.attrs.id as string);
    }
  });
  return ids;
}

export function tilePos(doc: Node, id: string): number | null {
  let found: number | null = null;
  doc.descendants((node, pos) => {
    if (found !== null) {
      return false;
    }
    if (isTile(node) && node.attrs.id === id) {
      found = pos;
      return false;
    }
  });
  return found;
}

/** The id of the tile the selection is on, if it is a node selection of a tile. */
export function selectedTileId(state: EditorState): string | null {
  const { selection } = state;
  if (selection instanceof NodeSelection && isTile(selection.node)) {
    return selection.node.attrs.id as string;
  }
  return null;
}

/**
 * The position after the block holding the selection, at the nearest depth whose node may
 * hold a tile: where a tile inserted at the caret goes.
 */
function insertionPos(state: EditorState): number | null {
  const { $head } = state.selection;
  for (let depth = $head.depth; depth >= 0; depth--) {
    const index = $head.indexAfter(depth);
    if ($head.node(depth).canReplaceWith(index, index, schema.nodes.tile)) {
      return depth === $head.depth ? $head.pos : $head.after(depth + 1);
    }
  }
  return null;
}

/** Rewrites the tile nodes in a slice, dropping those the mapper returns null for. */
function mapTiles(fragment: Fragment, map: (node: Node) => Node | null): Fragment {
  const nodes: Node[] = [];
  fragment.forEach((node) => {
    if (isTile(node)) {
      const mapped = map(node);
      if (mapped) {
        nodes.push(mapped);
      }
    } else if (node.content.size > 0) {
      nodes.push(node.copy(mapTiles(node.content, map)));
    } else {
      nodes.push(node);
    }
  });
  return Fragment.from(nodes);
}

function mapSlice(slice: Slice, map: (node: Node) => Node | null): Slice {
  return new Slice(mapTiles(slice.content, map), slice.openStart, slice.openEnd);
}

/**
 * Decides what a pasted or dropped tile node becomes: dropped when its tile is unknown, kept
 * when the tile has no node in the document (a cut, or a drag that moves it), or cloned.
 */
function adoptTile(node: Node, view: EditorView, body: Body): Node | null {
  const id = node.attrs.id as string;
  const tile = body.page.index.get(id);
  if (!tile) {
    return null;
  }
  if (view.dragging?.move || tilePos(view.state.doc, id) === null) {
    return node;
  }
  const copy = tile.clone({ parentId: null, at: null });
  return node.type.create({ id: copy.id });
}

class TilesView {
  private readonly view: EditorView;
  private readonly body: Body;
  private readonly registry: Map<string, TileNodeView>;
  private readonly abort = new AbortController();
  private readonly onTilesChange = this.mountArrived.bind(this);
  private selected: string | null;

  constructor(view: EditorView, body: Body, registry: Map<string, TileNodeView>) {
    this.view = view;
    this.body = body;
    this.registry = registry;
    this.selected = selectedTileId(view.state);

    body.page.editor?.selection.subscribe(() => this.syncFromEditor(), this.abort.signal);
    this.tilesMap.observe(this.onTilesChange);
  }

  private get tilesMap(): Y.Map<Y.Map<unknown>> {
    return this.body.page.doc.getMap<Y.Map<unknown>>("tiles");
  }

  update(view: EditorView, prevState: EditorState) {
    this.collect(view.state);
    if (view.state.selection !== prevState.selection) {
      const pos = insertionPos(view.state);
      this.body.insertionPoint.value = pos === null ? null : toRelativePosition(view.state, pos);
      this.syncToEditor(view.state);
    }
  }

  destroy() {
    this.abort.abort();
    this.tilesMap.unobserve(this.onTilesChange);
  }

  /** Deletes the maps of tiles whose nodes were removed, in the same undo step. */
  private collect(state: EditorState) {
    const removed = TILES_PLUGIN_KEY.getState(state)?.removed ?? [];
    if (removed.length === 0) {
      return;
    }
    this.body.page.doc.transact(() => {
      for (const id of removed) {
        this.tilesMap.delete(id);
      }
    });
  }

  private mountArrived(event: Y.YMapEvent<Y.Map<unknown>>) {
    for (const [id, change] of event.changes.keys) {
      if (change.action === "add") {
        const nodeView = this.registry.get(id);
        if (nodeView && !nodeView.mounted) {
          nodeView.mount();
        }
      }
    }
  }

  private syncToEditor(state: EditorState) {
    const editor = this.body.page.editor;
    const id = selectedTileId(state);
    const previous = this.selected;
    if (id === previous || !editor) {
      return;
    }
    this.selected = id;
    if (id && !(editor.selection.size === 1 && editor.selection.has(id))) {
      editor.select([id]);
    } else if (!id && previous && editor.selection.has(previous)) {
      editor.deselect([previous]);
    }
  }

  private syncFromEditor() {
    const editor = this.body.page.editor;
    const id = editor ? last(editor.selection) : null;
    if (!id || selectedTileId(this.view.state) === id) {
      return;
    }
    const pos = tilePos(this.view.state.doc, id);
    if (pos === null) {
      return;
    }
    const { state } = this.view;
    this.selected = id;
    this.view.dispatch(state.tr.setSelection(NodeSelection.create(state.doc, pos)));
  }
}

/**
 * Embedded tiles. With a body, the plugin renders tile nodes, keeps tile maps in step with
 * their nodes, resolves pasted tiles and bridges the node selection to the page selection.
 * Without one it strips tile nodes from pasted content.
 */
export function tiles({ body }: TilesOptions = {}): Plugin {
  if (!body) {
    return new Plugin({
      props: {
        transformPasted: (slice) => mapSlice(slice, () => null),
      },
    });
  }

  const registry = new Map<string, TileNodeView>();

  return new Plugin<TilesState>({
    key: TILES_PLUGIN_KEY,

    state: {
      init(_config, state) {
        return { ids: tileIds(state.doc), removed: [] };
      },

      apply(tr, value) {
        if (!tr.docChanged) {
          return { ids: value.ids, removed: [] };
        }
        const ids = tileIds(tr.doc);
        const local = !tr.getMeta(ySyncPluginKey) && tr.getMeta("uiEvent") !== "cut";
        const removed = local ? Array.from(value.ids).filter((id) => !ids.has(id)) : [];
        return { ids, removed };
      },
    },

    props: {
      nodeViews: {
        tile(node, view, getPos) {
          return new TileNodeView(node, view, getPos, body, registry);
        },
      },

      transformPasted(slice, view) {
        return mapSlice(slice, (node) => adoptTile(node, view, body));
      },
    },

    view(view) {
      return new TilesView(view, body, registry);
    },
  });
}
