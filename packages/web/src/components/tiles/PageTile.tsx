import Tile from "./Tile";
import styles from "./PageTile.module.css";
import { classNames } from "@/utils/css";
import type { Theme } from "@/types/pages";
import type { FontId } from "@/config/fonts";

interface PageTileProps {
  title: string;
  subtitle?: string | null;
  hue?: number | null;
  font?: FontId | null;
  theme?: Theme;
  imageUrl?: string | null;
  author?: {
    name: string;
    imageUrl?: string | null;
  } | null;
}

export default function PageTile({
  title,
  subtitle,
  imageUrl,
  author,
  hue,
  font,
  theme,
}: PageTileProps) {
  return (
    <Tile theme={theme} hue={hue} font={font} backgroundImageUrl={imageUrl}>
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
