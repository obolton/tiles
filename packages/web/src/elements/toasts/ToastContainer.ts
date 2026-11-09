import { fadeOut, moveTo } from "@/utils/animation/effects";
import infoIcon from "@/icons/info.svg";
import successIcon from "@/icons/success.svg";
import errorIcon from "@/icons/error.svg";

export type ToastType = "info" | "success" | "error";

const TOAST_DURATION = 5000;
const MAX_TOASTS = 5;

declare global {
  interface HTMLElementTagNameMap {
    "toast-container": ToastContainer;
  }
}

export default class ToastContainer extends HTMLElement {
  private paused = false;
  private popoverOpen = false;
  private timeout: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    super();
    this.pause = this.pause.bind(this);
    this.setRemoveToastTimeout = this.setRemoveToastTimeout.bind(this);
    this.removeNextToast = this.removeNextToast.bind(this);
  }

  connectedCallback() {
    // Toasts are shown as a manual popover so they render above open dialogs
    this.popover = "manual";
    this.addEventListener("pointerover", this.pause);
    this.addEventListener("pointerout", this.setRemoveToastTimeout);

    // Check for queued toasts
    const toastData = sessionStorage.getItem("toast");
    if (toastData) {
      sessionStorage.removeItem("toast");
      const toast = JSON.parse(toastData);
      if (typeof toast?.message === "string") {
        this.showToast(toast.message, toast.type);
      }
    }
  }

  disconnectedCallback() {
    this.removeEventListener("pointerover", this.pause);
    this.removeEventListener("pointerout", this.setRemoveToastTimeout);

    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
    this.paused = false;
    this.popoverOpen = false;
  }

  private pause() {
    this.paused = true;

    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
  }

  private setRemoveToastTimeout() {
    this.paused = false;

    if (this.timeout) {
      clearTimeout(this.timeout);
    }
    this.timeout = setTimeout(this.removeNextToast, TOAST_DURATION);
  }

  private async removeNextToast() {
    const toast = this.lastElementChild;

    if (!toast) {
      return;
    }

    await Promise.all([
      fadeOut(toast),
      moveTo(this, {
        y: `${toast.clientHeight + 8}px`,
      }),
    ]);
    toast.remove();

    if (this.childElementCount === 0) {
      this.closePopover();
      return;
    }
    if (!this.paused) {
      this.setRemoveToastTimeout();
    }
  }

  /** Shows the container in the top layer, above any dialog opened since it was last shown. */
  private openPopover() {
    if (this.popoverOpen) {
      this.hidePopover();
    }
    this.showPopover();
    this.popoverOpen = true;
  }

  private closePopover() {
    if (!this.popoverOpen) {
      return;
    }
    this.hidePopover();
    this.popoverOpen = false;
  }

  public showToast(message: string, type: ToastType = "info") {
    if (this.childElementCount >= MAX_TOASTS) {
      return;
    }

    const toast = document.createElement("output");
    toast.classList.add(type);
    toast.role = "status";

    const icon = document.createElement("img");
    icon.ariaHidden = "true";
    switch (type) {
      case "success":
        icon.src = successIcon;
        icon.alt = "Success";
        break;
      case "error":
        icon.src = errorIcon;
        icon.alt = "Error";
        break;
      case "info":
      default:
        icon.src = infoIcon;
        icon.alt = "Info";
        break;
    }

    toast.append(icon, document.createTextNode(message));
    this.prepend(toast);
    this.openPopover();

    if (!this.paused && this.childElementCount === 1) {
      this.setRemoveToastTimeout();
    }
  }
}

customElements.define("toast-container", ToastContainer);
