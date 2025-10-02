import { Plugin } from "prosemirror-state";
import Editor from "@/editor/Editor";
import type FilterSelect from "@/elements/filterSelect/FilterSelect";

export function dropdowns() {
  return new Plugin({
    props: {
      nodeViews: {
        dropdown(node, view, getPos) {
          const dropdownType = node.attrs.dropdownType as string;
          let value = node.attrs.value as string;
          let select: FilterSelect | null = null;

          const element = document.createElement("span");
          const button = document.createElement("button");
          button.role = "combobox";
          button.textContent = value;
          button.ariaExpanded = "false";
          button.ariaHasPopup = "listbox";
          element.appendChild(button);

          function open() {
            if (select) {
              return;
            }

            const dropdown = Editor.current.dropdowns.value.find(
              (dropdown) => dropdown.id === dropdownType,
            );

            if (!dropdown) {
              return;
            }

            const anchorName = "--dropdown-button";

            button.ariaExpanded = "true";
            button.style.setProperty("anchor-name", anchorName);

            select = document.createElement("filter-select");
            select.value = value;
            select.tabIndex = 0;
            select.placeholder = "Search";
            select.popover = "auto";
            select.style.setProperty("position-anchor", anchorName);

            for (const option of dropdown.options) {
              const optionElement = document.createElement("div");
              optionElement.textContent = option.value;
              optionElement.dataset.value = option.value;
              select.appendChild(optionElement);
            }

            element.appendChild(select);
            select.showPopover();
            select.focus();

            select.addEventListener("toggle", (event) => {
              if (event.newState === "closed") {
                close();
              }
            });

            select.addEventListener("change", () => {
              const pos = getPos();
              if (typeof pos !== "number" || !select) {
                return;
              }
              const value = select.value;

              if (value) {
                view.dispatch(
                  view.state.tr.setNodeAttribute(pos, "value", value),
                );
                close();
              } else {
                const newValue = select.inputValue;
                Editor.current
                  .addOptionToDropdown(dropdownType, newValue)
                  .then(() => {
                    view.dispatch(
                      view.state.tr.setNodeAttribute(pos, "value", newValue),
                    );
                    close();
                  });
              }
            });
          }

          function close() {
            if (!select) {
              return;
            }
            view.focus();
            select.remove();
            select = null;
            button.ariaExpanded = "false";
            button.style.removeProperty("anchor-name");
          }

          function onClick() {
            if (select) {
              close();
            } else {
              open();
            }
          }

          const abortController = new AbortController();
          const { signal } = abortController;

          button.addEventListener("click", onClick, { signal });

          return {
            dom: element,

            update(updatedNode) {
              value = updatedNode.attrs.value as string;

              if (value !== button.textContent) {
                button.textContent = value;
              }

              return true;
            },

            destroy() {
              abortController.abort();
            },

            ignoreMutation() {
              return true;
            },

            stopEvent() {
              return true;
            },
          };
        },
      },
    },
  });
}
