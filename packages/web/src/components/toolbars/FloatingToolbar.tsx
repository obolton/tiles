import { classNames } from "@/utils/css";
import styles from "./FloatingToolbar.module.css";

interface FloatingToolbarProps {
  className?: string;
  children: React.ReactNode;
}

export default function FloatingToolbar({
  className,
  children,
}: FloatingToolbarProps) {
  return (
    <menu
      className={classNames(styles.toolbar, className)}
      data-tooltip-position="top"
    >
      {children}
    </menu>
  );
}
