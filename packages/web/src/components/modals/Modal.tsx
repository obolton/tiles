import { ModalEvent } from "@/utils/modals";
import styles from "./Modal.module.css";
import type { StoreInterface } from "@/utils/reactivity";
import type { JSX } from "@/jsx/jsx";

interface ModalProps {
  children: JSX.Node;
  open: StoreInterface<boolean>;
  onClose: () => void;
}

export default function Modal({ children, onClose, open }: ModalProps) {
  let dialog: HTMLDialogElement | undefined;
  const ref = (element: HTMLDialogElement) => {
    dialog = element;
  };

  open.subscribe(() => {
    if (!dialog) {
      return;
    }
    if (open.value && !dialog.open) {
      dialog.showModal();
    } else if (!open.value && dialog.open) {
      dialog.close();
      Promise.all(dialog.getAnimations().map((animation) => animation.finished))
        .catch(() => {})
        .finally(() => dialog?.dispatchEvent(new ModalEvent("hidemodal")));
    }
  });

  const keyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
    }
  };

  const onClick = (event: MouseEvent) => {
    if (event.target === dialog) {
      onClose();
    }
  };

  return (
    <dialog
      popover="auto"
      ref={ref}
      className={styles.modal}
      onkeydown={keyDown}
      onclick={onClick}
    >
      {children}
    </dialog>
  );
}
