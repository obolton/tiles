import { Plugin, PluginKey } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";
import type { EditorView, NodeView } from "prosemirror-view";
import type { Node } from "prosemirror-model";
import MentionPicker from "@/components/mentions/MentionPicker";
import { render } from "@/jsx/dom";
import { getUserName } from "@/utils/users";
import { schema } from "./schema";

export interface MentionMeta {
  pos: number | null;
}

export const MENTION_PLUGIN_KEY = new PluginKey<DecorationSet | null>(
  "mention-plugin",
);

class MentionNodeView implements NodeView {
  readonly dom: HTMLSpanElement;

  private readonly view: EditorView;
  private readonly getPos: () => number | undefined;
  private userId: string;
  private displayName: string;

  constructor(node: Node, view: EditorView, getPos: () => number | undefined) {
    this.view = view;
    this.getPos = getPos;
    this.userId = node.attrs.userId as string;
    this.displayName = node.attrs.displayName as string;

    this.dom = document.createElement("span");
    this.dom.className = "mention";
    this.dom.dataset.userId = this.userId;

    this.updateDisplayName();
  }

  update(node: Node) {
    if (node.attrs.userId !== this.userId) {
      return false;
    }
    this.displayName = node.attrs.displayName as string;
    this.updateDisplayName();
    return true;
  }

  ignoreMutation() {
    return true;
  }

  stopEvent() {
    return true;
  }

  private updateDisplayName() {
    const currentName = getUserName(this.userId);

    if (currentName && currentName !== this.displayName) {
      // Update the node attribute if the name has changed
      const pos = this.getPos();
      if (typeof pos === "number") {
        this.view.dispatch(
          this.view.state.tr.setNodeAttribute(pos, "displayName", currentName),
        );
      }
      this.dom.textContent = currentName;
    } else {
      this.dom.textContent = currentName ?? this.displayName;
    }
  }
}

function getPickerElement(view: EditorView, getPos: () => number | undefined) {
  function onSelect(userId: string, displayName: string) {
    const pos = getPos();
    if (pos === undefined) {
      return;
    }

    const tr = view.state.tr;

    // Delete the @ and insert the mention
    tr.replaceRangeWith(
      pos - 1,
      pos,
      schema.nodes.mention.create({ userId, displayName }),
    );

    // Close the picker
    tr.setMeta(MENTION_PLUGIN_KEY, { pos: null } as MentionMeta);

    view.dispatch(tr);
    view.focus();
  }

  function onClose() {
    view.dispatch(
      view.state.tr.setMeta(MENTION_PLUGIN_KEY, { pos: null } as MentionMeta),
    );
    view.focus();
  }

  const element = render(
    <MentionPicker onSelect={onSelect} onClose={onClose} />,
  )[0] as HTMLElement;

  requestAnimationFrame(() => {
    const filterSelect = element.querySelector("filter-select");
    if (filterSelect) {
      filterSelect.showPopover();
      filterSelect.focus();
    }
  });

  return element;
}

export function mentions() {
  return new Plugin<DecorationSet | null>({
    key: MENTION_PLUGIN_KEY,

    state: {
      init() {
        return null;
      },

      apply(tr, decorations) {
        const meta = tr.getMeta(MENTION_PLUGIN_KEY) as MentionMeta | undefined;

        if (!meta) {
          return decorations?.map(tr.mapping, tr.doc) ?? null;
        }

        if (meta.pos === null) {
          return null;
        } else {
          const decoration = Decoration.widget(meta.pos, getPickerElement, {
            ignoreSelection: true,
            stopEvent: () => true,
          });
          return DecorationSet.create(tr.doc, [decoration]);
        }
      },
    },

    props: {
      handleTextInput(view, from, to, text) {
        if (text === "@") {
          const tr = view.state.tr.insertText("@", from, to);
          // Position after the @
          tr.setMeta(MENTION_PLUGIN_KEY, { pos: from + 1 } as MentionMeta);
          view.dispatch(tr);
          return true;
        }

        return false;
      },

      decorations(state) {
        return this.getState(state);
      },

      nodeViews: {
        mention(node, view, getPos) {
          return new MentionNodeView(node, view, getPos);
        },
      },
    },
  });
}
