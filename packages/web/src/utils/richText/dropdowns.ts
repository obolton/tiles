import { Plugin } from "prosemirror-state";
import Editor from "@/editor/Editor";
import type DropdownEditor from "@/elements/dropdown-editor/DropdownEditor";
import type DropdownOption from "@/elements/dropdown-editor/DropdownOption";
import type DropdownModel from "@/models/Dropdown";
import type { DeleteEvent, ReorderEvent } from "@/utils/events";

export function dropdowns() {
  return new Plugin({
    props: {
      nodeViews: {
        dropdown(node, view, getPos) {
          const dropdownType = node.attrs.dropdownType as string;
          let value = node.attrs.value as string;
          let editor: DropdownEditor | null = null;

          const element = document.createElement("span");
          const button = document.createElement("button");
          button.role = "combobox";
          button.textContent = value;
          button.ariaExpanded = "false";
          button.ariaHasPopup = "listbox";
          element.appendChild(button);

          function populateOptions(dropdown: DropdownModel) {
            if (!editor) return;
            editor.select.replaceChildren();
            for (const option of dropdown.options.value) {
              editor.addOption(option.value);
            }
          }

          function open() {
            if (editor) {
              return;
            }

            const dropdown = Editor.current.dropdowns.value.find(
              (d) => d.id === dropdownType,
            );

            if (!dropdown) {
              return;
            }

            const anchorName = "--dropdown-button";

            button.ariaExpanded = "true";
            button.style.setProperty("anchor-name", anchorName);

            editor = document.createElement("dropdown-editor");
            editor.value = value;
            editor.tabIndex = 0;
            editor.placeholder = "Search";
            editor.popover = "auto";
            editor.style.setProperty("position-anchor", anchorName);

            if (dropdown.title.value) {
              editor.dropdownTitle = dropdown.title.value;
            }

            populateOptions(dropdown);

            element.appendChild(editor);
            editor.showPopover();
            editor.focus();

            editor.addEventListener("toggle", handleToggle);
            editor.addEventListener("change", handleChange);
            editor.addEventListener("delete", handleDelete);
            editor.addEventListener("reorder", handleReorder);
            editor.addEventListener("append", handleAppend);
          }

          function handleToggle(event: ToggleEvent) {
            if (event.newState === "closed") {
              close();
            }
          }

          function handleChange(event: Event) {
            const pos = getPos();
            if (typeof pos !== "number" || !editor) {
              return;
            }

            const target = event.target;
            const dropdown = Editor.current.getDropdown(dropdownType);

            // Title change
            if (target === editor) {
              dropdown.setTitle(editor.dropdownTitle || null);
              return;
            }

            // Option value change
            if (
              target instanceof HTMLElement &&
              target.tagName === "DROPDOWN-OPTION"
            ) {
              const option = target as DropdownOption;
              const index = Array.from(editor.select.children).indexOf(option);
              if (index >= 0) {
                dropdown.updateOption(index, option.value);
              }
              return;
            }

            // Selection change (from FilterSelect)
            const selectedValue = editor.value;
            if (selectedValue) {
              view.dispatch(
                view.state.tr.setNodeAttribute(pos, "value", selectedValue),
              );
              close();
              return;
            }

            // New option creation (user typed a new value and pressed Enter)
            const newValue = editor.select.inputValue.trim();
            if (newValue) {
              dropdown.addOption(newValue).then(() => {
                populateOptions(dropdown);
                view.dispatch(
                  view.state.tr.setNodeAttribute(pos, "value", newValue),
                );
                close();
              });
            }
          }

          function handleDelete(event: DeleteEvent) {
            if (!editor) return;

            const option = event.target as DropdownOption;
            const index = Array.from(editor.select.children).indexOf(option);
            if (index >= 0) {
              const dropdown = Editor.current.getDropdown(dropdownType);
              dropdown.removeOption(index).then(() => {
                populateOptions(dropdown);
              });
            }
          }

          function handleReorder(event: ReorderEvent) {
            if (!editor) return;

            const dropdown = Editor.current.getDropdown(dropdownType);
            dropdown.reorderOptions(event.fromIndex, event.toIndex).then(() => {
              populateOptions(dropdown);
            });
          }

          function handleAppend() {
            if (!editor) return;

            const defaultValue = "New option";
            const option = editor.addOption(defaultValue);
            option.focus();

            const dropdown = Editor.current.getDropdown(dropdownType);
            dropdown.addOption(defaultValue);
          }

          function close() {
            if (!editor) {
              return;
            }
            view.focus();
            editor.removeEventListener("toggle", handleToggle);
            editor.removeEventListener("change", handleChange);
            editor.removeEventListener("delete", handleDelete);
            editor.removeEventListener("reorder", handleReorder);
            editor.removeEventListener("append", handleAppend);
            editor.remove();
            editor = null;
            button.ariaExpanded = "false";
            button.style.removeProperty("anchor-name");
          }

          function onClick() {
            if (editor) {
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
