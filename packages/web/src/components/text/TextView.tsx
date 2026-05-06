import RichText from "./RichText";
import { combine } from "@/utils/reactivity";
import styles from "./TextView.module.css";
import type Text from "@/models/Text";

export interface TextViewProps {
  text: Text;
}

export default function TextView({ text }: TextViewProps) {
  const { content, align } = text;

  const classList = combine({ align }, ({ align }) => ({
    "rich-text": true,
    [styles.text]: true,
    [styles["align-top"]]: align === "TOP",
    [styles["align-center"]]: align === "CENTER",
    [styles["align-bottom"]]: align === "BOTTOM",
  }));

  return (
    <div classList={classList}>
      {content.derive((value) => (
        <RichText content={value} />
      ))}
    </div>
  );
}
