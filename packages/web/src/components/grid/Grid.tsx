import { useEffect, useRef, useState } from "react";
import ImageTile from "@/components/tiles/ImageTile";
import VideoTile from "@/components/tiles/VideoTile";
import TextTile from "@/components/tiles/TextTile";
import PlaceTile from "@/components/tiles/PlaceTile";
import LinkTile from "@/components/tiles/LinkTile";
import HeadingTile from "@/components/tiles/HeadingTile";
import PageLinkTile from "@/components/tiles/PageLinkTile";
import EventTile from "@/components/tiles/EventTile";
import useLayoutTransition from "@/hooks/useLayoutTransition";
import useElementSizeRef from "@/hooks/useElementSizeRef";
import { scrollIntoView } from "@/hooks/useScrollIntoView";
import { moveElement } from "@/utils/arrays";
import client from "@/api/client";
import styles from "./Grid.module.css";
import type { ClientTile } from "@/types/tiles";
import type { DragDropEvent } from "@/utils/drag";
import type { ResizeEvent } from "@/utils/resize";

interface GridProps {
  tiles: ClientTile[];
}

function getTileComponent(tile: ClientTile) {
  const type = tile.type;
  switch (type) {
    case "IMAGE":
      return <ImageTile key={tile.id} tile={tile} />;
    case "VIDEO":
      return <VideoTile key={tile.id} tile={tile} />;
    case "TEXT":
      return <TextTile key={tile.id} tile={tile} />;
    case "PLACE":
      return <PlaceTile key={tile.id} tile={tile} />;
    case "LINK":
      return <LinkTile key={tile.id} tile={tile} />;
    case "HEADING":
      return <HeadingTile key={tile.id} tile={tile} />;
    case "PAGE_LINK":
      return <PageLinkTile key={tile.id} tile={tile} />;
    case "EVENT":
      return <EventTile key={tile.id} tile={tile} />;
    default:
      throw new Error(`Unknown tile type: ${type}`);
  }
}

const LAYOUT_TRANSITION_OPTIONS = {
  attributes: ["data-rows", "data-columns"],
};

export default function Grid({ tiles: initialTiles }: GridProps) {
  const ref = useRef<HTMLElement>(null);
  const sizeRef = useElementSizeRef(ref);
  const [tiles, setTiles] = useState(initialTiles);
  const { startLayoutTransition } = useLayoutTransition(
    ref,
    LAYOUT_TRANSITION_OPTIONS,
  );

  useEffect(() => {
    const create = (event: Event) => {
      const { detail: tile } = event as CustomEvent<ClientTile>;
      setTiles((prevTiles) => [...prevTiles, tile]);
      scrollIntoView(tile.id);
    };
    const update = (event: Event) => {
      const { detail: tile } = event as CustomEvent<ClientTile>;
      setTiles((prevTiles) =>
        prevTiles.map((prevTile) =>
          prevTile.id === tile.id ? tile : prevTile,
        ),
      );
    };
    const deleteTile = (event: Event) => {
      const { detail: tile } = event as CustomEvent<ClientTile>;
      const element = document.getElementById(tile.id);
      const adjacentTileId =
        element?.previousElementSibling?.id || element?.nextElementSibling?.id;
      startLayoutTransition(() => {
        setTiles((prevTiles) =>
          prevTiles.filter((prevTile) => prevTile.id !== tile.id),
        );
        if (adjacentTileId) {
          scrollIntoView(adjacentTileId);
        }
      });
    };
    const dragOver = (event: DragDropEvent) => {
      const { target, dragSource } = event;
      if (ref.current && target instanceof HTMLElement) {
        const fromPosition = Array.prototype.indexOf.call(
          ref.current.children,
          dragSource,
        );
        const toPosition = Array.prototype.indexOf.call(
          ref.current.children,
          target,
        );
        startLayoutTransition(() => {
          setTiles((prevTiles) =>
            moveElement(prevTiles, fromPosition, toPosition),
          );
        });
      }
    };
    const drop = async (event: DragDropEvent) => {
      const { dragSource } = event;
      if (ref.current) {
        const id = dragSource.dataset.tileId ?? "";
        const position = Array.prototype.indexOf.call(
          ref.current.children,
          dragSource,
        );
        await client.tiles.move.mutate({ id, position });
      }
    };
    const resize = (event: ResizeEvent) => {
      const { target, size } = event;
      if (
        !(target instanceof HTMLElement) ||
        !target.dataset.tileId ||
        !sizeRef.current ||
        !size
      ) {
        return;
      }
      const id = target.dataset.tileId;
      const columnWidth = sizeRef.current.width / 3;
      const columns = Math.round(size.width / columnWidth);
      const rows = Math.round(size.height / columnWidth);
      const tile = tiles.find((tile) => tile.id === id);

      if (!tile) {
        return;
      }

      if (columns !== tile.columns || rows != tile.rows) {
        startLayoutTransition(() => {
          setTiles((prevTiles) =>
            prevTiles.map((prevTile) =>
              prevTile.id === id ? { ...prevTile, columns, rows } : prevTile,
            ),
          );
        });
      }
    };
    const resizeEnd = async (event: ResizeEvent) => {
      const { target, size } = event;
      if (
        !(target instanceof HTMLElement) ||
        !sizeRef.current ||
        !size ||
        !target.dataset.tileId
      ) {
        return;
      }
      const id = target.dataset.tileId;
      const columnWidth = sizeRef.current.width / 3;
      const columns = Math.max(Math.round(size.width / columnWidth), 1);
      const rows = Math.max(Math.round(size.height / columnWidth), 1);
      await client.tiles.resize.mutate({ id, columns, rows });
    };
    window.addEventListener("tile:create", create);
    window.addEventListener("tile:update", update);
    window.addEventListener("tile:delete", deleteTile);
    window.addEventListener("drag:drag-over", dragOver);
    window.addEventListener("drag:drop", drop);
    window.addEventListener("resize:resize", resize);
    window.addEventListener("resize:end", resizeEnd);
    return () => {
      window.removeEventListener("tile:create", create);
      window.removeEventListener("tile:update", update);
      window.removeEventListener("tile:delete", deleteTile);
      window.removeEventListener("drag:drag-over", dragOver);
      window.removeEventListener("drag:drop", drop);
      window.removeEventListener("resize:resize", resize);
      window.removeEventListener("resize:end", resizeEnd);
    };
  }, [sizeRef, startLayoutTransition, tiles]);

  return (
    <section className={styles.grid} ref={ref}>
      {tiles.map(getTileComponent)}
    </section>
  );
}
