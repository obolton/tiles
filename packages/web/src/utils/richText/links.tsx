import { Plugin } from "prosemirror-state";
import Themeable from "@/components/themes/Themeable";
import { render } from "@/jsx/dom";
import { reactive } from "@/utils/reactivity";
import {
  LINK_THEMES,
  LINK_THEME_OPTIONS,
  DEFAULT_LINK_THEME,
  type LinkThemeProps,
} from "@/components/links/themes";
import type ThemeSelector from "@/elements/themes/ThemeSelector";

export function links() {
  return new Plugin({
    props: {
      nodeViews: {
        link(node, view, getPos) {
          const theme = reactive<string>(
            node.attrs.theme || DEFAULT_LINK_THEME,
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
              href: node.attrs.href,
              children: dom.contents.textContent,
            };
          }

          const dom = render(
            <Themeable<LinkThemeProps>
              theme={theme}
              options={LINK_THEME_OPTIONS}
              registry={LINK_THEMES}
              getProps={getProps}
              onChange={onChange}
              data-tooltip="Link"
              inline
            />,
          ) as ThemeSelector;

          return {
            dom,
            contentDOM: dom.contents,

            update() {
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
