import Tile, { type TileBackground } from "./Tile";
import styles from "./PageTile.module.css";
import { reactive } from "@/utils/reactivity";
import type { FontId } from "@/config/fonts";
import type { JSX } from "@/jsx/jsx";

export interface PageTileProps {
  title: string;
  background: TileBackground;
  font?: FontId | null;
  children?: JSX.Node;
}

export default function PageTile({
  title,
  background,
  font,
  children,
}: PageTileProps) {
  return (
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
    </Tile>
  );
}
