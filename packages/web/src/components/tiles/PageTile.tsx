import Tile from "./Tile";
import styles from "./PageTile.module.css";
import { reactive } from "@/utils/reactivity";
import type { Color } from "@/utils/color";
import type { FontId } from "@/config/fonts";
import type { JSX } from "@/jsx/jsx";

export interface PageTileProps {
  title: string;
  font?: FontId | null;
  color: Color | null;
  coverImageUrl?: string | null;
  children?: JSX.Node;
}

export default function PageTile({
  title,
  coverImageUrl,
  font,
  color,
  children,
}: PageTileProps) {
  return (
    <Tile
      className={styles.tile}
      color={reactive(color)}
      font={font}
      backgroundImageUrl={coverImageUrl ? reactive(coverImageUrl) : undefined}
      border="inside"
    >
      <p
        classList={{
          [styles.text]: true,
          [styles["with-image"]]: !!coverImageUrl,
        }}
      >
        {title}
      </p>
      {children}
    </Tile>
  );
}
