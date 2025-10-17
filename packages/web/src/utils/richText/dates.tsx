import { Plugin } from "prosemirror-state";
import Themeable from "@/components/themes/Themeable";
import { render } from "@/jsx/dom";
import { showModal } from "@/utils/modals";
import { reactive } from "@/utils/reactivity";
import {
  DATE_THEMES,
  DATE_THEME_OPTIONS,
  DEFAULT_DATE_THEME,
  type DateTimeThemeProps,
} from "@/components/dates/themes";
import type { DateTimeModalResult } from "@/components/modals/DateTimeModal";

export function dates() {
  return new Plugin({
    props: {
      nodeViews: {
        date(node, view, getPos) {
          const theme = reactive<string>(
            node.attrs.theme || DEFAULT_DATE_THEME,
          );
          const value = reactive(node.attrs.value as Date);
          const time = reactive(node.attrs.time as boolean);

          function edit() {
            showModal<DateTimeModalResult>("DATE_TIME", {
              value: value.value,
              time: time.value,
              onConfirm(result) {
                const pos = getPos();
                if (typeof pos !== "number") {
                  return;
                }
                value.value = result.value;
                time.value = result.time;
                view.dispatch(
                  view.state.tr.setNodeMarkup(pos, null, {
                    value: result.value,
                    time: result.time,
                  }),
                );
              },
            });
          }

          function onKeyDown(event: KeyboardEvent) {
            if (event.key === "Enter") {
              edit();
            }
          }

          function getProps() {
            return {
              value,
              time,
            };
          }

          function onChange(value: string) {
            const pos = getPos();
            if (typeof pos === "undefined") {
              return;
            }
            theme.value = value;
            view.dispatch(view.state.tr.setNodeAttribute(pos, "theme", value));
          }

          return {
            dom: render(
              <Themeable<DateTimeThemeProps>
                theme={theme}
                options={DATE_THEME_OPTIONS}
                registry={DATE_THEMES}
                getProps={getProps}
                onChange={onChange}
                data-tooltip="Date"
                inline
                on:click={edit}
                on:keydown={onKeyDown}
              />,
            )[0] as HTMLElement,

            update() {
              return true;
            },

            stopEvent(event) {
              if (event.type === "mousedown" || event.type === "pointerdown") {
                event.preventDefault();
                return true;
              }

              return false;
            },
          };
        },
      },
    },
  });
}
