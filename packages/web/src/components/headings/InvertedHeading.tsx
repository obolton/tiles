import HeadingTag from "./HeadingTag";
import styles from "./InvertedHeading.module.css";
import type { HeadingThemeProps } from "./themes";

export default function InvertedHeading(props: HeadingThemeProps) {
  return <HeadingTag className={styles.heading} {...props} />;
}
