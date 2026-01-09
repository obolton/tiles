import Tile from "./Tile";
import ArrowOutwardIcon from "@/icons/arrow-outward.svg?jsx";
import styles from "./PageLink.module.css";
import type { JSX } from "@/jsx/jsx";
import type { Fill } from "@/components/fills/types";
import type { Animation } from "@/models/Tile";
import type { Reactive } from "@/utils/reactivity";

export interface PageLinkProps extends JSX.Attributes<"a"> {
  pageId: string;
  title: string;
  background: Fill | null;
  animation?: Reactive<Animation | null>;
}

export default function PageLink({
  pageId,
  title,
  background,
  animation,
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
      <Tile animation={animation} className={styles.tile} border="inside">
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
