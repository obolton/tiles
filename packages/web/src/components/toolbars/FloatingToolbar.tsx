import styles from "./FloatingToolbar.module.css";

interface FloatingToolbarProps {
  children: React.ReactNode;
}

function preventDefault(event: React.PointerEvent) {
  event.preventDefault();
  event.stopPropagation();
}

function refCallback(element: HTMLMenuElement | null) {
  element?.showPopover();
}

export default function FloatingToolbar({ children }: FloatingToolbarProps) {
  return (
    <menu
      ref={refCallback}
      className={styles.toolbar}
      data-tooltip-position="top"
      // Prevent the toolbar items from stealing focus on pointer down
      onPointerDownCapture={preventDefault}
      popover="manual"
    >
      {children}
    </menu>
  );
}
