import Tile from "./Tile";
import styles from "./PageTile.module.css";
import { classNames } from "@/utils/css";
import type { Theme } from "@/types/pages";
import type { FontId } from "@/config/fonts";

export interface PageTileProps {
  title: string;
  subtitle?: string | null;
  hue?: number | null;
  font?: FontId | null;
  theme?: Theme;
  coverImageUrl?: string | null;
  author?: {
    name: string;
    imageUrl?: string | null;
  } | null;
  children?: React.ReactNode;
}

export default function PageTile({
  title,
  subtitle,
  coverImageUrl,
  author,
  hue,
  font,
  theme,
  children,
}: PageTileProps) {
  return (
    <Tile
      className={styles.tile}
      theme={theme}
      hue={hue}
      font={font}
      backgroundImageUrl={coverImageUrl}
      border="inside"
    >
      <section
        className={classNames(
          styles.text,
          coverImageUrl && styles["with-image"],
          theme === "LIGHT"
            ? styles.light
            : theme === "DARK"
              ? styles.dark
              : styles.color,
        )}
      >
        <p className={styles.title}>{title}</p>

        {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}

        {author ? (
          <address>
            {author.imageUrl ? (
              <img
                className="profile-image"
                src={author.imageUrl}
                alt={author.name}
              />
            ) : null}
            <span>{author.name}</span>
          </address>
        ) : null}
      </section>
      {children}
    </Tile>
  );
}
