import styles from "./Modal.module.css";
import type { JSX } from "jsx/jsx";

export interface ModalProps {
  children: JSX.Node;
}

function onKeyDown(event: KeyboardEvent) {
  const dialog = event.currentTarget as HTMLDialogElement;
  if (event.key === "Escape" && !event.defaultPrevented) {
    event.preventDefault();
    dialog.requestClose();
  }
}

function onClick(event: MouseEvent) {
  const dialog = event.currentTarget as HTMLDialogElement;
  if (event.target === dialog && !event.defaultPrevented) {
    event.preventDefault();
    dialog.requestClose();
  }
}

export default function Modal({ children }: ModalProps) {
  return (
    <dialog className={styles.modal} on:keydown={onKeyDown} on:click={onClick}>
      {children}
    </dialog>
  );
}
