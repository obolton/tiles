import { useCallback, useEffect, useRef, useState } from "react";
import { ModalEvent } from "@/utils/modals";
import styles from "./Modal.module.css";

interface ModalProps {
  children: React.ReactNode;
  open: boolean;
  onClose: () => void;
}

export default function Modal({ children, onClose, open }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [mouseDownOutside, setMouseDownOutside] = useState(false);

  useEffect(() => {
    const element = dialogRef.current;
    if (!element) {
      return;
    }
    if (open && !element.open) {
      element.showModal();
    } else if (!open && element.open) {
      element.close();
      Promise.all(
        element.getAnimations().map((animation) => animation.finished),
      )
        .catch(() => {})
        .finally(() => element.dispatchEvent(new ModalEvent("hidemodal")));
    }
  }, [open]);

  const keyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    },
    [onClose],
  );

  const onClick = useCallback(
    (event: React.MouseEvent) => {
      if (event.currentTarget === dialogRef.current && mouseDownOutside) {
        onClose();
      }
    },
    [mouseDownOutside, onClose],
  );

  const onMouseDown = useCallback(
    (event: React.MouseEvent) =>
      setMouseDownOutside(event.target === dialogRef.current),
    [],
  );

  return (
    <dialog
      popover="auto"
      ref={dialogRef}
      className={styles.modal}
      onKeyDown={keyDown}
      onClick={onClick}
      onMouseDown={onMouseDown}
    >
      {children}
    </dialog>
  );
}
