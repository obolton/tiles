import Tile, { type TileProps } from "./Tile";
import styles from "./PageTile.module.css";
import { classNames } from "@/utils/css";
import type { Theme } from "@/types/pages";

interface PageTileProps extends TileProps {
  id: string;
  title: string;
  subtitle?: string | null;
  hue?: number | null;
  font?: string | null;
  theme?: Theme;
  imageUrl?: string;
  author?: {
    name: string;
    imageUrl?: string | null;
  } | null;
}

export default function PageTile({
  id,
  title,
  subtitle,
  imageUrl,
  author,
  hue,
  font,
  theme,
}: PageTileProps) {
  return (
    <Tile
      id={id}
      theme={theme}
      hue={hue}
      font={font}
      backgroundImageUrl={imageUrl}
    >
      <section
        className={classNames(
          styles.text,
          imageUrl && styles["with-image"],
          theme === "LIGHT"
            ? styles.light
            : theme === "DARK"
              ? styles.dark
              : styles.color,
        )}
      >
        <h3>{title}</h3>

        {subtitle ? <p>{subtitle}</p> : null}

        {author ? (
          <address>
            <profile-image src={author.imageUrl} name={author.name} />
            <span>{author.name}</span>
          </address>
        ) : null}
      </section>
    </Tile>
  );
}
