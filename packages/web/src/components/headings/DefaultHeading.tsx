import HeadingTag from "./HeadingTag";
import type { HeadingThemeProps } from "./themes";

export default function DefaultHeading(props: HeadingThemeProps) {
  return <HeadingTag {...props} />;
}
