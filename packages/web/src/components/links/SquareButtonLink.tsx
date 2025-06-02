import { LINK_ATTRIBUTES } from "./constants";
import type { LinkThemeProps } from "./themes";
import styles from "./SquareButtonLink.module.css";

export default function SquareButtonLink({ href, children }: LinkThemeProps) {
  return (
    <a className={styles.button} href={href} {...LINK_ATTRIBUTES}>
      {children}
    </a>
  );
}
