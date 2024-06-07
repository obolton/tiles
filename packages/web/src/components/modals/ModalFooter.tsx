import { memo } from "react";
import styles from "./ModalFooter.module.css";

interface ModalFooterProps {
  children: React.ReactNode;
}

function ModalFooter({ children }: ModalFooterProps) {
  return <footer className={styles.modalFooter}>{children}</footer>;
}

export default memo(ModalFooter);
