import { memo } from "react";
import styles from "./ModalHeader.module.css";

interface ModalHeaderProps {
  children: React.ReactNode;
}

function ModalHeader({ children }: ModalHeaderProps) {
  return <header className={styles.header}>{children}</header>;
}

export default memo(ModalHeader);
