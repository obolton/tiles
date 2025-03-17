import { classNames } from "@/utils/css";
import styles from "./FloatingToolbar.module.css";

interface FloatingToolbarProps {
  className?: string;
  children: React.ReactNode;
}

function preventDefault(event: React.PointerEvent) {
  event.preventDefault();
}

export default function FloatingToolbar({
  className,
  children,
}: FloatingToolbarProps) {
  return (
    <div className={styles.container}>
      <menu
        className={classNames(styles.toolbar, className)}
        data-tooltip-position="top"
        // Prevent the toolbar items from stealing focus on pointer down
        onPointerDownCapture={preventDefault}
      >
        {children}
      </menu>
    </div>
  );
}
