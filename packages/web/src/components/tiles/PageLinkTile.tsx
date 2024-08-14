import Tile from "./Tile";
import { getImageUrl } from "@/utils/images";
import RichText from "@/components/text/RichText";
import styles from "./PageLinkTile.module.css";
import type { ClientPageLinkTile, ClientThumbnailTile } from "@/types/tiles";

type PageLinkTileProps = {
  tile: ClientPageLinkTile;
};

interface ThumbnailTileProps extends ClientThumbnailTile {
  children: React.ReactNode;
  padding?: boolean;
  hue?: number | null;
}

function ThumbnailTile({
  columns,
  rows,
  children,
  padding = true,
  hue,
}: ThumbnailTileProps) {
  return (
    <div
      className={`${styles.tile} ${padding ? styles.padding : ""}`}
      style={
        {
          "--columns": columns,
          "--rows": rows,
          "--hue": typeof hue === "number" ? `${hue.toFixed(2)}deg` : undefined,
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}

function getTileComponent(tile: ClientThumbnailTile) {
  const type = tile.type;
  switch (type) {
    case "IMAGE":
      return tile.image ? (
        <ThumbnailTile key={tile.id} {...tile} padding={false}>
          <img
            className={styles.image}
            src={getImageUrl(tile.image.imageKey)}
            alt={tile.image.caption ?? ""}
          />
        </ThumbnailTile>
      ) : null;
    case "VIDEO":
      return (
        <ThumbnailTile key={tile.id} {...tile}>
          {tile.video?.title}
        </ThumbnailTile>
      );
    case "TEXT":
      return (
        <ThumbnailTile key={tile.id} {...tile} hue={tile.text?.hue}>
          <RichText content={tile.text?.content ?? []} />
        </ThumbnailTile>
      );
    case "PLACE":
      return tile.place ? (
        <ThumbnailTile key={tile.id} {...tile} padding={false}>
          {tile.place.name}
        </ThumbnailTile>
      ) : null;
    case "LINK":
      return (
        <ThumbnailTile key={tile.id} {...tile}>
          {tile.link?.title}
        </ThumbnailTile>
      );
    case "HEADING":
      return <h4 key={tile.id}>{tile.heading?.content}</h4>;
    case "PAGE_LINK":
      return (
        <ThumbnailTile key={tile.id} {...tile}>
          Page link
        </ThumbnailTile>
      );
    default:
      throw new Error(`Unknown tile type: ${type}`);
  }
}

export default function PageLinkTile({ tile }: PageLinkTileProps) {
  const {
    pageLink: { pageId, page },
  } = tile;

  if (!page) {
    return (
      <Tile tile={tile} showInLightbox={false}>
        <div className={`${styles.page} ${styles.deleted}`}>
          This page no longer exists.
        </div>
      </Tile>
    );
  }

  const { title, subtitle, tiles } = page;

  return (
    <Tile tile={tile} showInLightbox={false} hue={page.hue} font={page.font}>
      {/* eslint-disable-next-line react/jsx-no-target-blank */}
      <a className={styles.page} href={`/pages/${pageId}`} target="_blank">
        <h3>{title}</h3>
        {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
        <section className={styles.grid}>{tiles.map(getTileComponent)}</section>
      </a>
    </Tile>
  );
}
