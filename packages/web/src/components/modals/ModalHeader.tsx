import styles from "./ModalHeader.module.css";
import type { JSX } from "jsx/jsx";

interface ModalHeaderProps {
  children: JSX.Node;
}

export default function ModalHeader({ children }: ModalHeaderProps) {
  return <header className={styles.header}>{children}</header>;
}
