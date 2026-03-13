import { classNames } from "@/utils/css";
import type { JSX } from "@/jsx/jsx";

export interface HeadingTagProps {
  className?: string;
  level: 1 | 2 | 3;
  align?: "left" | "center" | "right" | "justify";
  lineHeight?: number;
  children?: JSX.Node;
}

export default function HeadingTag({
  className,
  level,
  align,
  lineHeight,
  ...props
}: HeadingTagProps) {
  const style = { lineHeight };
  switch (level) {
    case 1:
      return (
        <h1 className={classNames(align, className)} style={style} {...props} />
      );
    case 2:
      return (
        <h2 className={classNames(align, className)} style={style} {...props} />
      );
    case 3:
      return (
        <h3 className={classNames(align, className)} style={style} {...props} />
      );
    default:
      throw new Error("Invalid heading level: " + level);
  }
}
