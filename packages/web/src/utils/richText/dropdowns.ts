import { Plugin } from "prosemirror-state";
import type { EditorView } from "prosemirror-view";
import type { Node } from "prosemirror-model";
import Editor from "@/editor/Editor";
import type DropdownEditor from "@/elements/dropdown-editor/DropdownEditor";
import type DropdownOption from "@/elements/dropdown-editor/DropdownOption";
import type DropdownModel from "@/models/Dropdown";
import type { DeleteEvent, ReorderEvent } from "@/utils/events";

class DropdownNodeView implements EventListenerObject {
  readonly dom: HTMLSpanElement;

  private dropdownType: string;
  private value: string;
  private editor: DropdownEditor | null = null;
  private button: HTMLButtonElement;
  private view: EditorView;
  private getPos: () => number | undefined;
  private abortController: AbortController;

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

    this.abortController = new AbortController();
    this.button.addEventListener("click", this, {
      signal: this.abortController.signal,
    });
  }

  handleEvent(event: Event): void {
    switch (event.type) {
      case "click":
        this.onClick();
        break;
      case "toggle":
        this.onToggle(event as ToggleEvent);
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
      case "append":
        this.onAppend();
        break;
    }
  }

  update(updatedNode: Node): boolean {
    this.value = updatedNode.attrs.value as string;

    if (this.value !== this.button.textContent) {
      this.button.textContent = this.value;
    }

    return true;
  }

  destroy(): void {
    this.abortController.abort();
  }

  ignoreMutation(): boolean {
    return true;
  }

  stopEvent(): boolean {
    return true;
  }

  private populateOptions(dropdown: DropdownModel): void {
    if (!this.editor) return;
    this.editor.select.replaceChildren();
    for (const option of dropdown.options.value) {
      this.editor.addOption(option.value);
    }
  }

  private open(): void {
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
    this.editor.addEventListener("append", this);
  }

  private close(): void {
    if (!this.editor) {
      return;
    }
    this.view.focus();
    this.editor.removeEventListener("toggle", this);
    this.editor.removeEventListener("change", this);
    this.editor.removeEventListener("delete", this);
    this.editor.removeEventListener("reorder", this);
    this.editor.removeEventListener("append", this);
    this.editor.remove();
    this.editor = null;
    this.button.ariaExpanded = "false";
    this.button.style.removeProperty("anchor-name");
  }

  private onClick(): void {
    if (this.editor) {
      this.close();
    } else {
      this.open();
    }
  }

  private onToggle(event: ToggleEvent): void {
    if (event.newState === "closed") {
      this.close();
    }
  }

  private onChange(event: Event): void {
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
        dropdown.updateOption(index, option.value);
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

  private onDelete(event: DeleteEvent): void {
    if (!this.editor) return;

    const option = event.target as DropdownOption;
    const index = Array.from(this.editor.select.children).indexOf(option);
    if (index >= 0) {
      const dropdown = Editor.current.getDropdown(this.dropdownType);
      dropdown.removeOption(index).then(() => {
        this.populateOptions(dropdown);
      });
    }
  }

  private onReorder(event: ReorderEvent): void {
    if (!this.editor) return;

    const dropdown = Editor.current.getDropdown(this.dropdownType);
    dropdown.reorderOptions(event.fromIndex, event.toIndex).then(() => {
      this.populateOptions(dropdown);
    });
  }

  private onAppend(): void {
    if (!this.editor) return;

    const defaultValue = "New option";
    const option = this.editor.addOption(defaultValue);
    option.focus();

    const dropdown = Editor.current.getDropdown(this.dropdownType);
    dropdown.addOption(defaultValue);
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
