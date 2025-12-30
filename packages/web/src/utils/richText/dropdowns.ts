import { Plugin } from "prosemirror-state";
import type { EditorView, NodeView } from "prosemirror-view";
import type { Node } from "prosemirror-model";
import Editor from "@/editor/Editor";
import type DropdownEditor from "@/elements/dropdown-editor/DropdownEditor";
import type DropdownOption from "@/elements/dropdown-editor/DropdownOption";
import type DropdownModel from "@/models/Dropdown";
import type { DeleteEvent, ReorderEvent } from "@/utils/events";

class DropdownNodeView implements NodeView, EventListenerObject {
  readonly dom: HTMLSpanElement;

  private readonly dropdownType: string;
  private readonly view: EditorView;
  private readonly getPos: () => number | undefined;
  private readonly button: HTMLButtonElement;
  private readonly abortController = new AbortController();

  private value: string;
  private editor: DropdownEditor | null = null;

  constructor(node: Node, view: EditorView, getPos: () => number | undefined) {
    this.dropdownType = node.attrs.dropdownType as string;
    this.value = node.attrs.value as string;
    this.view = view;
    this.getPos = getPos;

    this.dom = document.createElement("span");
    this.button = document.createElement("button");
    this.button.role = "combobox";
    this.button.textContent = this.value;
    this.button.ariaExpanded = "false";
    this.button.ariaHasPopup = "listbox";
    this.dom.appendChild(this.button);

    this.button.addEventListener("click", this, {
      signal: this.abortController.signal,
    });
  }

  handleEvent(event: Event) {
    switch (event.type) {
      case "click":
        if (this.editor) {
          this.close();
        } else {
          this.open();
        }
        break;
      case "toggle":
        if ((event as ToggleEvent).newState === "closed") {
          this.close();
        }
        break;
      case "change":
        this.onChange(event);
        break;
      case "delete":
        this.onDelete(event as DeleteEvent);
        break;
      case "reorder":
        this.onReorder(event as ReorderEvent);
        break;
    }
  }

  update(updatedNode: Node) {
    this.value = updatedNode.attrs.value as string;

    if (this.value !== this.button.textContent) {
      this.button.textContent = this.value;
    }

    return true;
  }

  destroy() {
    this.abortController.abort();
  }

  ignoreMutation() {
    return true;
  }

  stopEvent() {
    return true;
  }

  selectNode() {
    this.button.focus();
  }

  private populateOptions(dropdown: DropdownModel) {
    if (!this.editor) {
      return;
    }
    this.editor.select.replaceChildren();
    for (const option of dropdown.options.value) {
      this.editor.addOption(option.value);
    }
  }

  private open() {
    if (this.editor) {
      return;
    }

    const dropdown = Editor.current.dropdowns.value.find(
      (d) => d.id === this.dropdownType,
    );
    if (!dropdown) {
      return;
    }

    const anchorName = "--dropdown-button";

    this.button.ariaExpanded = "true";
    this.button.style.setProperty("anchor-name", anchorName);

    this.editor = document.createElement("dropdown-editor");
    this.editor.value = this.value;
    this.editor.tabIndex = 0;
    this.editor.placeholder = "Search";
    this.editor.popover = "auto";
    this.editor.style.setProperty("position-anchor", anchorName);

    if (dropdown.title.value) {
      this.editor.dropdownTitle = dropdown.title.value;
    }

    this.populateOptions(dropdown);

    this.dom.appendChild(this.editor);
    this.editor.showPopover();
    this.editor.focus();

    this.editor.addEventListener("toggle", this);
    this.editor.addEventListener("change", this);
    this.editor.addEventListener("delete", this);
    this.editor.addEventListener("reorder", this);
  }

  private close() {
    if (!this.editor) {
      return;
    }

    this.view.focus();
    this.editor.remove();
    this.editor = null;
    this.button.ariaExpanded = "false";
    this.button.style.removeProperty("anchor-name");
  }

  private onChange(event: Event) {
    const pos = this.getPos();
    if (typeof pos !== "number" || !this.editor) {
      return;
    }

    const target = event.target;
    const dropdown = Editor.current.getDropdown(this.dropdownType);

    // Title change
    if (target === this.editor) {
      dropdown.setTitle(this.editor.dropdownTitle || null);
      return;
    }

    // Option value change
    if (target instanceof HTMLElement && target.tagName === "DROPDOWN-OPTION") {
      const option = target as DropdownOption;
      const index = Array.from(this.editor.select.children).indexOf(option);
      if (index >= 0) {
        if (index >= dropdown.options.value.length) {
          dropdown.addOption(option.value);
        } else {
          dropdown.updateOption(index, option.value);
        }
      }
      return;
    }

    // Selection change (from FilterSelect)
    const selectedValue = this.editor.value;
    if (selectedValue) {
      this.view.dispatch(
        this.view.state.tr.setNodeAttribute(pos, "value", selectedValue),
      );
      this.close();
      return;
    }

    // New option creation (user typed a new value and pressed Enter)
    const newValue = this.editor.select.inputValue.trim();
    if (newValue) {
      dropdown.addOption(newValue).then(() => {
        this.populateOptions(dropdown);
        this.view.dispatch(
          this.view.state.tr.setNodeAttribute(pos, "value", newValue),
        );
        this.close();
      });
    }
  }

  private onDelete(event: DeleteEvent) {
    if (!this.editor) {
      return;
    }

    const option = event.target as DropdownOption;
    const index = Array.from(this.editor.select.children).indexOf(option);
    if (index >= 0) {
      const dropdown = Editor.current.getDropdown(this.dropdownType);
      dropdown.removeOption(index).then(() => {
        this.populateOptions(dropdown);
      });
    }
  }

  private onReorder(event: ReorderEvent) {
    if (!this.editor) {
      return;
    }

    const dropdown = Editor.current.getDropdown(this.dropdownType);
    dropdown.reorderOptions(event.fromIndex, event.toIndex).then(() => {
      this.populateOptions(dropdown);
    });
  }
}

export function dropdowns() {
  return new Plugin({
    props: {
      nodeViews: {
        dropdown(node, view, getPos) {
          return new DropdownNodeView(node, view, getPos);
        },
      },
    },
  });
}
