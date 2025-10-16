import Tile, { type TileBackground } from "./Tile";
import ArrowOutwardIcon from "@/icons/arrow-outward.svg?jsx";
import styles from "./PageTile.module.css";
import { reactive } from "@/utils/reactivity";
import { classNames } from "@/utils/css";
import type { FontId } from "@/config/fonts";
import type { JSX } from "@/jsx/jsx";

export interface PageTileProps extends JSX.Attributes<HTMLAnchorElement> {
  id: string;
  title: string;
  background: TileBackground;
  font?: FontId | null;
}

export default function PageTile({
  id,
  title,
  background,
  font,
  target,
  children,
  ...props
}: PageTileProps) {
  return (
    <a className={styles.link} href={`/pages/${id}`} target={target} {...props}>
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
          <ArrowOutwardIcon
            className={classNames(styles.icon)}
            aria-hidden="true"
          />
        ) : null}
      </Tile>
    </a>
  );
}
