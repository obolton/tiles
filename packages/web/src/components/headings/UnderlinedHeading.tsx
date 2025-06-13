import HeadingTag from "./HeadingTag";
import styles from "./UnderlinedHeading.module.css";
import type { HeadingThemeProps } from "./themes";

export default function UnderlinedHeading(props: HeadingThemeProps) {
  return <HeadingTag className={styles.heading} {...props} />;
}
