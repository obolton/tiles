import styles from "./ModalBody.module.css";
import type { JSX } from "@/jsx/jsx";

interface ModalBodyProps {
  children: JSX.Node;
}

export default function ModalBody({ children }: ModalBodyProps) {
  return <section className={styles.body}>{children}</section>;
}
