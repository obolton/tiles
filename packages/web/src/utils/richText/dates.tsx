import { Plugin } from "prosemirror-state";
import type { EditorView, NodeView } from "prosemirror-view";
import type { Node } from "prosemirror-model";
import Themeable from "@/components/themes/Themeable";
import { render } from "jsx/dom";
import { showModal } from "@/utils/modals";
import { reactive } from "reactivity";
import {
  DATE_THEMES,
  DATE_THEME_OPTIONS,
  DEFAULT_DATE_THEME,
  type DateTimeThemeProps,
} from "@/components/dates/themes";

const DateTimeModalLoader = () => import("@/components/modals/DateTimeModal");

class DateNodeView implements NodeView {
  readonly dom: HTMLElement;

  private readonly view: EditorView;
  private readonly getPos: () => number | undefined;
  private readonly theme = reactive<string>(DEFAULT_DATE_THEME);
  private readonly value: ReturnType<typeof reactive<Date>>;
  private readonly time: ReturnType<typeof reactive<boolean>>;

  constructor(node: Node, view: EditorView, getPos: () => number | undefined) {
    this.view = view;
    this.getPos = getPos;

    this.theme.value = (node.attrs.theme as string | null) ?? DEFAULT_DATE_THEME;
    this.value = reactive(new Date(node.attrs.value as string));
    this.time = reactive(node.attrs.time as boolean);

    this.dom = render(
      <Themeable<DateTimeThemeProps>
        theme={this.theme}
        options={DATE_THEME_OPTIONS}
        registry={DATE_THEMES}
        getProps={() => this.getProps()}
        onChange={(value) => this.onChange(value)}
        data-tooltip="Date"
        inline
        on:click={() => this.edit()}
        on:keydown={(event) => this.onKeyDown(event)}
      />,
    )[0] as HTMLElement;
  }

  update(node: Node) {
    this.value.value = new Date(node.attrs.value as string);
    this.time.value = node.attrs.time as boolean;
    this.theme.value = (node.attrs.theme as string | null) ?? DEFAULT_DATE_THEME;
    return true;
  }

  stopEvent(event: Event) {
    if (event.type === "mousedown" || event.type === "pointerdown") {
      event.preventDefault();
      return true;
    }

    return false;
  }

  private getProps(): DateTimeThemeProps {
    return {
      value: this.value,
      time: this.time,
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

  private edit() {
    void showModal(DateTimeModalLoader, {
      props: {
        value: this.value.value,
        time: this.time.value,
      },
      onConfirm: (result) => {
        const pos = this.getPos();
        if (typeof pos !== "number") {
          return;
        }
        this.value.value = result.value;
        this.time.value = result.time;
        this.view.dispatch(
          this.view.state.tr.setNodeMarkup(pos, null, {
            value: result.value.toISOString(),
            time: result.time,
          }),
        );
      },
    });
  }

  private onKeyDown(event: KeyboardEvent) {
    if (event.key === "Enter") {
      this.edit();
    }
  }
}

export function dates() {
  return new Plugin({
    props: {
      nodeViews: {
        date(node, view, getPos) {
          return new DateNodeView(node, view, getPos);
        },
      },
    },
  });
}
