import { Plugin } from "prosemirror-state";
import Editor from "@/editor/Editor";

export function dropdowns() {
  return new Plugin({
    props: {
      nodeViews: {
        dropdown(node, view, getPos) {
          const element = document.createElement("select");

          const dropdownType = node.attrs.dropdownType as string;
          let value = node.attrs.value as string;

          function updateOptions() {
            const dropdown = Editor.current.dropdowns.value.find(
              (dropdown) => dropdown.id === dropdownType,
            );

            if (!dropdown) {
              element.replaceChildren();
              return;
            }

            const fragment = document.createDocumentFragment();
            for (const option of dropdown.options) {
              const optionElement = document.createElement("option");
              optionElement.value = option.value;
              optionElement.textContent = option.value;
              fragment.appendChild(optionElement);
            }
            element.replaceChildren(fragment);
          }

          function onChange() {
            const pos = getPos();
            if (typeof pos !== "number") {
              return;
            }
            const value = element.value;
            view.dispatch(view.state.tr.setNodeAttribute(pos, "value", value));
          }

          updateOptions();
          element.value = value;

          const abortController = new AbortController();
          const { signal } = abortController;

          element.addEventListener("change", onChange, { signal });
          Editor.current.dropdowns.subscribe(updateOptions, signal);

          return {
            dom: element,

            update(updatedNode) {
              value = updatedNode.attrs.value as string;

              if (element.value !== value) {
                element.value = value;
              }

              return true;
            },

            destroy() {
              abortController.abort();
            },

            ignoreMutation() {
              return true;
            },

            stopEvent(event) {
              return event.type === "mousedown" || event.type === "pointerdown";
            },
          };
        },
      },
    },
  });
}
