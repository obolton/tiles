import styles from "./FloatingToolbar.module.css";

interface FloatingToolbarProps {
  children: React.ReactNode;
}

function preventDefault(event: React.PointerEvent) {
  event.preventDefault();
  event.stopPropagation();
}

function refCallback(element: HTMLDivElement | null) {
  element?.showPopover();
}

// TODO: Implement keyboard interactions:
// https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/menubar_role#keyboard_interactions
export default function FloatingToolbar({ children }: FloatingToolbarProps) {
  return (
    <div
      role="menubar"
      ref={refCallback}
      className={styles.toolbar}
      popover="manual"
      data-tooltip-position="top"
      // Prevent the toolbar items from stealing focus on pointer down
      onPointerDownCapture={preventDefault}
    >
      {children}
    </div>
  );
}
