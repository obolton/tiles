import { memo } from "react";
import styles from "./ModalHeader.module.css";

interface ModalHeaderProps {
  children: React.ReactNode;
}

function ModalHeader({ children }: ModalHeaderProps) {
  return (
    <header className={styles.header}>
      <h2>{children}</h2>
    </header>
  );
}

export default memo(ModalHeader);
