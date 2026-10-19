import styles from "./ModalFooter.module.css";
import { classNames } from "@/utils/css";
import type { JSX } from "jsx/jsx";

interface ModalFooterProps {
  className?: string;
  children: JSX.Node;
}

export default function ModalFooter({ className, children }: ModalFooterProps) {
  return <footer className={classNames(styles.footer, className)}>{children}</footer>;
}
