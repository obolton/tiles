import styles from "./ModalBody.module.css";
import { classNames } from "@/utils/css";
import type { JSX } from "@/jsx/jsx";

interface ModalBodyProps {
  className?: string;
  children: JSX.Node;
}

export default function ModalBody({ children, className }: ModalBodyProps) {
  return <section className={classNames(styles.body, className)}>{children}</section>;
}
