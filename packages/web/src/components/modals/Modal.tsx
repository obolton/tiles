import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { ModalEvent } from "@/utils/modals";
import styles from "./Modal.module.css";

interface ModalProps {
  children: React.ReactNode;
  open: boolean;
  onClose: () => void;
  originRect?: DOMRect;
}

export default function Modal({
  children,
  onClose,
  open,
  originRect,
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({});
  const [mouseDownOutside, setMouseDownOutside] = useState(false);

  useLayoutEffect(
    () =>
      setStyle(
        originRect
          ? ({
              "--delta-x": `${
                originRect.x + originRect.width / 2 - window.innerWidth / 2
              }px`,
              "--delta-y": `${
                originRect.y + originRect.height / 2 - window.innerHeight / 2
              }px`,
            } as React.CSSProperties)
          : ({
              "--delta-x": "0",
              "--delta-y": "100px",
            } as React.CSSProperties),
      ),
    [originRect],
  );

  useEffect(() => {
    if (!dialogRef.current) {
      return;
    }
    if (open && !dialogRef.current.open) {
      dialogRef.current.showModal();
    } else if (!open && dialogRef.current.open) {
      dialogRef.current.close();
      Promise.all(
        dialogRef.current
          .getAnimations()
          .map((animation) => animation.finished),
      )
        .catch(console.error)
        .finally(() =>
          dialogRef.current?.dispatchEvent(new ModalEvent("modal:remove")),
        );
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

  const click = useCallback(
    (event: React.MouseEvent) => {
      if (event.currentTarget === dialogRef.current && mouseDownOutside) {
        onClose();
      }
    },
    [mouseDownOutside, onClose],
  );

  const mouseDown = useCallback(
    (event: React.MouseEvent) =>
      setMouseDownOutside(event.target === dialogRef.current),
    [],
  );

  return (
    <dialog
      // @ts-expect-error React does not currently support the popover attribute
      // https://github.com/facebook/react/pull/27981
      popover="auto"
      ref={dialogRef}
      style={style}
      className={styles.modal}
      onKeyDown={keyDown}
      onClick={click}
      onMouseDown={mouseDown}
    >
      {children}
    </dialog>
  );
}
