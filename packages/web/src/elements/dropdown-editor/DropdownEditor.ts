import type FilterSelect from "@/elements/filter-select/FilterSelect";
import type { DragDropEvent } from "@/utils/drag";
import { ReorderEvent } from "@/utils/events";
import DropdownOption from "./DropdownOption";
import css from "./DropdownEditor.css?inline";
import writeIcon from "@/icons/write.svg?raw";
import newIcon from "@/icons/new.svg?raw";

const stylesheet = new CSSStyleSheet();
stylesheet.replaceSync(css);

export interface DropdownEditorAttributes {
  dropdowntitle?: string;
  placeholder?: string;
  value?: string;
  editing?: boolean;
}

declare global {
  interface HTMLElementTagNameMap {
    "dropdown-editor": DropdownEditor;
  }
}

export default class DropdownEditor extends HTMLElement {
  static readonly observedAttributes: (keyof DropdownEditorAttributes)[] = [
    "dropdowntitle",
    "placeholder",
    "value",
    "editing",
  ];

  private readonly header: HTMLDivElement;
  private readonly titleText: HTMLSpanElement;
  private readonly titleInput: HTMLInputElement;
  private readonly editButton: HTMLButtonElement;
  private readonly addButton: HTMLButtonElement;
  readonly select: FilterSelect;

  constructor() {
    super();

    const shadow = this.attachShadow({ mode: "open" });
    shadow.adoptedStyleSheets = [stylesheet];

    // Header with title and edit button
    this.header = document.createElement("div");
    this.header.id = "header";

    // Title text (visible in view mode)
    this.titleText = document.createElement("span");
    this.titleText.id = "title-text";
    this.titleText.textContent = "Dropdown";

    // Title input (visible in edit mode)
    this.titleInput = document.createElement("input");
    this.titleInput.id = "title-input";
    this.titleInput.type = "text";
    this.titleInput.placeholder = "Add title...";

    // Edit button
    this.editButton = document.createElement("button");
    this.editButton.id = "edit";
    this.editButton.type = "button";
    this.editButton.ariaPressed = "false";
    this.editButton.innerHTML = writeIcon;

    this.header.append(this.titleText, this.titleInput, this.editButton);

    // Slot for the FilterSelect in light DOM
    const slot = document.createElement("slot");

    // Add button (visible in edit mode)
    this.addButton = document.createElement("button");
    this.addButton.id = "add";
    this.addButton.type = "button";
    this.addButton.innerHTML = newIcon;

    shadow.append(this.header, slot, this.addButton);

    // FilterSelect (appended in connectedCallback)
    this.select = document.createElement("filter-select");

    // Event listeners
    this.titleInput.addEventListener("blur", this);
    this.editButton.addEventListener("click", this);
    this.addButton.addEventListener("click", this);
  }

  connectedCallback() {
    if (!this.select.parentNode) {
      this.appendChild(this.select);
    }

    // Enable drop target for reordering
    this.select.dataset.drop = "true";
    this.select.addEventListener("dnd-drop", this);
  }

  disconnectedCallback() {
    this.select.removeEventListener("dnd-drop", this);
  }

  attributeChangedCallback(
    name: keyof DropdownEditorAttributes,
    _oldValue: string | null,
    newValue: string | null,
  ) {
    switch (name) {
      case "dropdowntitle":
        this.titleText.textContent = newValue || "Dropdown";
        this.titleInput.value = newValue ?? "";
        break;
      case "placeholder":
        this.select.placeholder = newValue ?? "";
        break;
      case "value":
        this.select.value = newValue ?? "";
        break;
      case "editing":
        this.updateOptionsEditingState(newValue !== null);
        break;
    }
  }

  private updateOptionsEditingState(editing: boolean) {
    if (!editing) {
      // Remove blank options when exiting edit mode
      for (const option of this.select.querySelectorAll('dropdown-option[value=""]')) {
        option.remove();
      }
    }

    for (const option of this.select.children) {
      if (editing) {
        option.setAttribute("editing", "");
      } else {
        option.removeAttribute("editing");
      }
    }
  }

  // Properties

  get dropdownTitle() {
    return this.getAttribute("dropdowntitle") ?? "";
  }

  set dropdownTitle(value: string) {
    if (value) {
      this.setAttribute("dropdowntitle", value);
    } else {
      this.removeAttribute("dropdowntitle");
    }
  }

  get value() {
    return this.select.value;
  }

  set value(val: string) {
    this.select.value = val;
  }

  get placeholder() {
    return this.select.placeholder;
  }

  set placeholder(val: string) {
    this.select.placeholder = val;
  }

  get editing() {
    return this.hasAttribute("editing");
  }

  set editing(val: boolean) {
    if (val) {
      this.setAttribute("editing", "");
    } else {
      this.removeAttribute("editing");
    }
  }

  override focus() {
    this.select.focus();
  }

  // Option management

  addOption(value: string): DropdownOption {
    const option = document.createElement("dropdown-option");
    option.value = value;
    option.textContent = value;
    if (this.editing) {
      option.editing = true;
    }
    this.select.appendChild(option);
    return option;
  }

  // Events

  handleEvent(event: Event) {
    switch (event.type) {
      case "click":
        if (event.target === this.editButton) {
          this.editing = !this.editing;
          this.editButton.ariaPressed = this.editing ? "true" : "false";
        } else if (event.target === this.addButton) {
          const option = this.addOption("");
          option.focus();
        }
        break;
      case "blur":
        if (event.target === this.titleInput) {
          this.commitTitleEdit();
        }
        break;
      case "dnd-drop":
        this.handleDrop(event as DragDropEvent);
        break;
    }
  }

  private handleDrop(event: DragDropEvent) {
    const draggedOption = event.dragSource;
    if (!(draggedOption instanceof DropdownOption)) {
      return;
    }

    const options = Array.from(this.select.children);
    const fromIndex = options.indexOf(draggedOption);

    if (fromIndex < 0) {
      return;
    }

    // Calculate target index based on drop position
    let toIndex = options.length - 1;
    for (const [i, option] of options.entries()) {
      const rect = option.getBoundingClientRect();
      const midpoint = rect.top + rect.height / 2;

      if (event.clientY < midpoint) {
        toIndex = i;
        break;
      }
    }

    // Adjust toIndex if dragging downward
    if (toIndex > fromIndex) {
      toIndex--;
    }

    if (fromIndex !== toIndex) {
      this.dispatchEvent(new ReorderEvent({ fromIndex, toIndex }));
    }
  }

  private commitTitleEdit() {
    const newTitle = this.titleInput.value.trim();
    if (newTitle !== this.dropdownTitle) {
      this.dropdownTitle = newTitle;
      this.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }
}

customElements.define("dropdown-editor", DropdownEditor);
