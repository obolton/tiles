import Tile from "./Tile";
import ArrowOutwardIcon from "@/icons/arrow-outward.svg?jsx";
import styles from "./PageLink.module.css";
import { reactive } from "@/utils/reactivity";
import type { FontId } from "@/config/fonts";
import type { JSX } from "@/jsx/jsx";
import type { Fill } from "@/components/fills/types";

export interface PageLinkProps extends JSX.Attributes<"a"> {
  pageId: string;
  title: string;
  background: Fill | null;
  font?: FontId | null;
}

export default function PageLink({
  pageId,
  title,
  background,
  font,
  target,
  children,
  ...props
}: PageLinkProps) {
  return (
    <a
      className={styles.link}
      href={`/pages/${pageId}`}
      target={target}
      {...props}
    >
      <Tile
        className={styles.tile}
        background={reactive(background)}
        font={font}
        border="inside"
      >
        <p
          classList={{
            [styles.text]: true,
            [styles["with-image"]]: background && "imageUrl" in background,
          }}
        >
          {title}
        </p>

        {children}

        {target === "_blank" ? (
          <ArrowOutwardIcon className={styles.icon} aria-hidden="true" />
        ) : null}
      </Tile>
    </a>
  );
}
