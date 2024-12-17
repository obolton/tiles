import { memo } from "react";
import styles from "./ModalFooter.module.css";
import { classNames } from "@/utils/css";

interface ModalFooterProps {
  className?: string;
  children: React.ReactNode;
}

function ModalFooter({ className, children }: ModalFooterProps) {
  return (
    <footer className={classNames(styles.footer, className)}>{children}</footer>
  );
}

export default memo(ModalFooter);
