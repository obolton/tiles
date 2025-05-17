import { Plugin } from "prosemirror-state";
import DateTime from "@/components/dates/DateTime";
import { render } from "@/jsx/dom";
import { showModal } from "@/utils/modals";
import { ReactiveValue } from "@/utils/reactivity";
import type { DateTimeModalResult } from "@/components/modals/DateTimeModal";

export function dates() {
  return new Plugin({
    props: {
      nodeViews: {
        date(node, view, getPos) {
          const value = new ReactiveValue(node.attrs.value as Date);
          const time = new ReactiveValue(node.attrs.time as boolean);

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

          return {
            dom: render(
              <DateTime
                value={value}
                time={time}
                onclick={edit}
                onkeydown={onKeyDown}
                data-tooltip="Edit date"
                data-tooltip-position="top"
              />,
            ) as HTMLTimeElement,
          };
        },
      },
    },
  });
}
