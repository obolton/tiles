import { LINK_ATTRIBUTES } from "./constants";
import type { LinkThemeProps } from "./themes";

export default function DefaultLink({ href, children }: LinkThemeProps) {
  return (
    <a href={href} {...LINK_ATTRIBUTES}>
      {children}
    </a>
  );
}
