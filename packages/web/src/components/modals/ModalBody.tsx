import styles from "./ModalBody.module.css";

interface ModalBodyProps {
  children: React.ReactNode;
}

export default function ModalBody({ children }: ModalBodyProps) {
  return <section className={styles.body}>{children}</section>;
}
