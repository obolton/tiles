import Tile from "./Tile";
import styles from "./PageTile.module.css";
import { classNames } from "@/utils/css";
import { ReactiveValue } from "@/utils/reactivity";
import { isDark, type Color } from "@/utils/color";
import type { FontId } from "@/config/fonts";
import type { JSX } from "@/jsx/jsx";

export interface PageTileProps {
  title: string;
  subtitle?: string | null;
  hue?: number | null;
  font?: FontId | null;
  color: Color;
  coverImageUrl?: string | null;
  author?: {
    name: string;
    imageUrl?: string | null;
  } | null;
  children?: JSX.Node;
}

export default function PageTile({
  title,
  subtitle,
  coverImageUrl,
  author,
  font,
  color,
  children,
}: PageTileProps) {
  return (
    <Tile
      className={styles.tile}
      color={new ReactiveValue(color)}
      font={font}
      backgroundImageUrl={coverImageUrl}
      border="inside"
    >
      <section
        className={classNames(
          styles.text,
          coverImageUrl && styles["with-image"],
          isDark(color) ? styles.dark : styles.light,
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
