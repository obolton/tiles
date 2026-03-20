import { makeDraggable } from "@/utils/drag";
import { DeleteEvent } from "@/utils/events";
import css from "./DropdownOption.css?inline";
import menuIcon from "@/icons/menu.svg?raw";
import trashIcon from "@/icons/trash.svg?raw";

const stylesheet = new CSSStyleSheet();
stylesheet.replaceSync(css);

export interface DropdownOptionAttributes {
  value: string;
  editing?: boolean;
}

declare global {
  interface HTMLElementTagNameMap {
    "dropdown-option": DropdownOption;
  }
}

export default class DropdownOption extends HTMLElement {
  static readonly observedAttributes: (keyof DropdownOptionAttributes)[] = [
    "value",
    "editing",
  ];

  private readonly dragHandle: HTMLSpanElement;
  private readonly contentSlot: HTMLSlotElement;
  private readonly editInput: HTMLInputElement;
  private readonly deleteButton: HTMLButtonElement;

  constructor() {
    super();

    const shadow = this.attachShadow({ mode: "open" });
    shadow.adoptedStyleSheets = [stylesheet];

    this.dragHandle = document.createElement("span");
    this.dragHandle.id = "drag-handle";
    this.dragHandle.innerHTML = menuIcon;

    this.contentSlot = document.createElement("slot");

    this.editInput = document.createElement("input");
    this.editInput.id = "input";
    this.editInput.type = "text";
    this.editInput.required = true;

    this.deleteButton = document.createElement("button");
    this.deleteButton.id = "delete";
    this.deleteButton.type = "button";
    this.deleteButton.innerHTML = trashIcon;

    shadow.append(
      this.dragHandle,
      this.contentSlot,
      this.editInput,
      this.deleteButton,
    );

    shadow.addEventListener("click", this);
    this.editInput.addEventListener("blur", this);
    this.editInput.addEventListener("keydown", this);

    makeDraggable(this, {
      handle: this.dragHandle,
      constrain: "vertical",
      clone: true,
    });
  }

  attributeChangedCallback(
    name: keyof DropdownOptionAttributes,
    _oldValue: string | null,
    newValue: string | null,
  ) {
    switch (name) {
      case "value":
        this.editInput.value = newValue ?? "";
        this.dataset.value = newValue ?? "";
        break;
      case "editing":
        if (newValue !== null) {
          this.editInput.value = this.value;
        }
        break;
    }
  }

  // Properties

  get value() {
    return this.getAttribute("value") ?? "";
  }

  set value(val: string) {
    this.setAttribute("value", val);
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
    this.editInput.focus();
    this.editInput.select();
  }

  // Events

  handleEvent(event: Event) {
    switch (event.type) {
      case "click":
        if (event.target === this.deleteButton) {
          event.stopPropagation();
          this.dispatchEvent(new DeleteEvent());
        } else if (this.editing) {
          // Prevent clicks in edit mode from selecting the option
          event.stopPropagation();
        }
        break;
      case "blur":
        if (event.target === this.editInput) {
          this.commitEdit();
        }
        break;
      case "keydown":
        this.handleKeyDown(event as KeyboardEvent);
        break;
    }
  }

  private handleKeyDown(event: KeyboardEvent) {
    if (event.key === "Enter") {
      event.preventDefault();
      this.commitEdit();
    }
  }

  private commitEdit() {
    const newValue = this.editInput.value.trim();
    const oldValue = this.value;

    // Don't commit if blank or duplicate
    if (!newValue || this.isDuplicate(newValue)) {
      return;
    }

    if (newValue !== oldValue) {
      this.value = newValue;
      this.textContent = newValue;
      this.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }

  private isDuplicate(value: string) {
    const parent = this.closest("filter-select");
    if (!parent) {
      return false;
    }

    const match = parent.querySelector(
      `dropdown-option[value="${CSS.escape(value)}"]`,
    );
    return match !== null && match !== this;
  }
}

customElements.define("dropdown-option", DropdownOption);
