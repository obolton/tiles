import { Plugin } from "prosemirror-state";
import type { EditorView, NodeView, ViewMutationRecord } from "prosemirror-view";
import type { Node } from "prosemirror-model";
import Themeable from "@/components/themes/Themeable";
import { render } from "@/jsx/dom";
import { reactive } from "reactivity";
import {
  LINK_THEMES,
  LINK_THEME_OPTIONS,
  DEFAULT_LINK_THEME,
  type LinkThemeProps,
} from "@/components/links/themes";
import type ThemeSelector from "@/elements/themes/ThemeSelector";

class LinkNodeView implements NodeView {
  readonly dom: ThemeSelector;
  readonly contentDOM: HTMLElement;

  private readonly view: EditorView;
  private readonly getPos: () => number | undefined;
  private readonly theme = reactive<string>(DEFAULT_LINK_THEME);

  private node: Node;

  constructor(node: Node, view: EditorView, getPos: () => number | undefined) {
    this.node = node;
    this.view = view;
    this.getPos = getPos;

    if (node.attrs.theme) {
      this.theme.value = node.attrs.theme as string;
    }

    this.dom = render(
      <Themeable<LinkThemeProps>
        theme={this.theme}
        options={LINK_THEME_OPTIONS}
        registry={LINK_THEMES}
        getProps={() => this.getProps()}
        onChange={(value) => this.onChange(value)}
        data-tooltip="Link"
        inline
      />,
    )[0] as ThemeSelector;

    this.contentDOM = this.dom.contents;
  }

  update(updatedNode: Node) {
    this.node = updatedNode;
    return true;
  }

  ignoreMutation(mutation: ViewMutationRecord) {
    return !this.contentDOM.contains(mutation.target);
  }

  private getProps(): LinkThemeProps {
    return {
      href: reactive(this.node.attrs.href as string),
      children: this.contentDOM.textContent,
    };
  }

  private onChange(value: string) {
    const pos = this.getPos();
    if (typeof pos === "undefined") {
      return;
    }
    this.theme.value = value;
    this.view.dispatch(this.view.state.tr.setNodeAttribute(pos, "theme", value));
  }
}

export function links() {
  return new Plugin({
    props: {
      nodeViews: {
        link(node, view, getPos) {
          return new LinkNodeView(node, view, getPos);
        },
      },
    },
  });
}
