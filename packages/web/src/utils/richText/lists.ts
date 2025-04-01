import { Plugin } from "prosemirror-state";

export function lists() {
  return new Plugin({
    props: {
      nodeViews: {
        list_item: (node, view, getPos) => {
          const { attrs } = node;
          const li = document.createElement("li");
          if (typeof attrs.checked === "boolean") {
            li.role = "checkbox";
            li.ariaChecked = attrs.checked ? "true" : "false";
          }

          li.addEventListener("click", (event) => {
            if (
              event.defaultPrevented ||
              event.target !== li ||
              li.role !== "checkbox"
            ) {
              return;
            }
            const pos = getPos();
            if (!pos) {
              return;
            }
            const checked = li.ariaChecked === "true";
            view.dispatch(
              view.state.tr.setNodeAttribute(pos, "checked", !checked),
            );
            event.preventDefault();
          });

          return {
            dom: li,
            contentDOM: li,
            update(node) {
              if (typeof node.attrs.checked === "boolean") {
                li.role = "checkbox";
                li.ariaChecked = node.attrs.checked ? "true" : "false";
              } else {
                li.role = null;
                li.ariaChecked = null;
              }
              return true;
            },
          };
        },
      },
    },
  });
}
