import { Plugin } from "prosemirror-state";
import type { EditorView, NodeView, ViewMutationRecord } from "prosemirror-view";
import type { Node } from "prosemirror-model";
import Themeable from "@/components/themes/Themeable";
import { render } from "jsx/dom";
import { reactive } from "carillon";
import {
  HEADING_THEMES,
  HEADING_THEME_OPTIONS,
  DEFAULT_HEADING_THEME,
  type HeadingThemeProps,
} from "@/components/headings/themes";
import type ThemeSelector from "@/elements/themes/ThemeSelector";
import type { TextAlignment } from "./schema";

class HeadingNodeView implements NodeView {
  readonly dom: ThemeSelector;
  readonly contentDOM: HTMLElement;

  private readonly view: EditorView;
  private readonly getPos: () => number | undefined;
  private readonly theme = reactive<string>(DEFAULT_HEADING_THEME);

  private node: Node;

  constructor(node: Node, view: EditorView, getPos: () => number | undefined) {
    this.node = node;
    this.view = view;
    this.getPos = getPos;

    if (node.attrs.theme) {
      this.theme.value = node.attrs.theme as string;
    }

    this.dom = render(
      <Themeable<HeadingThemeProps>
        theme={this.theme}
        options={HEADING_THEME_OPTIONS}
        registry={HEADING_THEMES}
        getProps={() => this.getProps()}
        onChange={(value) => this.onChange(value)}
      />,
    )[0] as ThemeSelector;

    this.contentDOM = this.dom.contents;
  }

  update(updatedNode: Node) {
    if (
      updatedNode.attrs.level !== this.node.attrs.level ||
      updatedNode.attrs.align !== this.node.attrs.align ||
      updatedNode.attrs.lineHeight !== this.node.attrs.lineHeight ||
      updatedNode.attrs.indent !== this.node.attrs.indent
    ) {
      return false;
    }

    this.node = updatedNode;
    return true;
  }

  ignoreMutation(mutation: ViewMutationRecord) {
    return !this.contentDOM.contains(mutation.target);
  }

  private getProps(): HeadingThemeProps {
    return {
      level: this.node.attrs.level as 1 | 2 | 3,
      align: this.node.attrs.align as TextAlignment | undefined,
      lineHeight: this.node.attrs.lineHeight as number | undefined,
      indent: this.node.attrs.indent as number | undefined,
      children: this.contentDOM.textContent,
    };
  }

  private onChange(value: string) {
    const pos = this.getPos();
    if (typeof pos !== "number") {
      return;
    }
    this.theme.value = value;
    this.view.dispatch(this.view.state.tr.setNodeAttribute(pos, "theme", value));
  }
}

export function headings() {
  return new Plugin({
    props: {
      nodeViews: {
        heading(node, view, getPos) {
          return new HeadingNodeView(node, view, getPos);
        },
      },
    },
  });
}
