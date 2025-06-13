import { Plugin } from "prosemirror-state";
import Themeable from "@/components/themes/Themeable";
import { render } from "@/jsx/dom";
import { reactive } from "@/utils/reactivity";
import {
  HEADING_THEMES,
  HEADING_THEME_OPTIONS,
  DEFAULT_HEADING_THEME,
  type HeadingThemeProps,
} from "@/components/headings/themes";
import type ThemeSelector from "@/elements/themes/ThemeSelector";

export function headings() {
  return new Plugin({
    props: {
      nodeViews: {
        heading(node, view, getPos) {
          const theme = reactive<string>(
            node.attrs.theme || DEFAULT_HEADING_THEME,
          );

          function onChange(value: string) {
            const pos = getPos();
            if (typeof pos === "undefined") {
              return;
            }
            theme.value = value;
            view.dispatch(view.state.tr.setNodeAttribute(pos, "theme", value));
          }

          function getProps() {
            return {
              level: node.attrs.level,
              align: node.attrs.align,
              children: dom.contents.textContent,
            };
          }

          const dom = render(
            <Themeable<HeadingThemeProps>
              theme={theme}
              options={HEADING_THEME_OPTIONS}
              registry={HEADING_THEMES}
              getProps={getProps}
              onChange={onChange}
              data-tooltip="Heading"
            />,
          ) as ThemeSelector;

          return {
            dom,
            contentDOM: dom.contents,

            update(updatedNode) {
              if (
                updatedNode.attrs.level !== node.attrs.level ||
                updatedNode.attrs.align !== node.attrs.align
              ) {
                return false;
              }

              return true;
            },

            ignoreMutation() {
              return true;
            },
          };
        },
      },
    },
  });
}
