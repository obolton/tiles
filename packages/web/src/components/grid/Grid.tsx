import { useCallback, useEffect, useRef, useState } from "react";
import ImageTile from "@/components/tiles/ImageTile";
import VideoTile from "@/components/tiles/VideoTile";
import TextTile from "@/components/tiles/TextTile";
import MapTile from "@/components/tiles/MapTile";
import LinkTile from "@/components/tiles/LinkTile";
import HeadingTile from "@/components/tiles/HeadingTile";
import PageLinkTile from "@/components/tiles/PageLinkTile";
import EventTile from "@/components/tiles/EventTile";
import CollectionTile from "@/components/tiles/CollectionTile";
import useLayoutTransition, {
  type AnimateLayoutOptions,
} from "@/hooks/useLayoutTransition";
import useElementSizeRef from "@/hooks/useElementSizeRef";
import { scrollIntoView } from "@/hooks/useScrollIntoView";
import { moveElement } from "@/utils/arrays";
import client from "@/api/client";
import styles from "./Grid.module.css";
import type { ClientTile } from "@/types/tiles";
import type { DragDropEvent } from "@/utils/drag";
import type { ResizeEvent } from "@/utils/resize";
import { viewTransition } from "@/utils/transitions";
import useEditable from "@/hooks/useEditable";
import GridItem from "./GridItem";
import { deleteTile } from "@/utils/edit";
import { destroy, DEFAULT_TIMING } from "@/utils/animation/effects";

interface GridProps {
  tiles: ClientTile[];
}

function getTileComponent(tile: ClientTile) {
  const type = tile.type;
  const props = {
    id: tile.id,
    rows: tile.rows,
    columns: tile.columns,
  };
  switch (type) {
    case "IMAGE":
      return <ImageTile {...props} image={tile.image} />;
    case "VIDEO":
      return <VideoTile {...props} video={tile.video} />;
    case "TEXT":
      return <TextTile {...props} text={tile.text} />;
    case "MAP":
      return <MapTile {...props} map={tile.map} />;
    case "LINK":
      return <LinkTile {...props} link={tile.link} />;
    case "HEADING":
      return <HeadingTile {...props} heading={tile.heading} />;
    case "PAGE_LINK":
      return <PageLinkTile {...props} pageLink={tile.pageLink} />;
    case "EVENT":
      return <EventTile {...props} event={tile.event} />;
    case "COLLECTION":
      return <CollectionTile {...props} collection={tile.collection} />;
    default:
      throw new Error(`Unknown tile type: ${type}`);
  }
}

const LAYOUT_TRANSITION_OPTIONS: AnimateLayoutOptions = {
  attributes: ["data-rows", "data-columns"],
  size: true,
};

export default function Grid({ tiles: initialTiles }: GridProps) {
  const ref = useRef<HTMLElement>(null);
  const sizeRef = useElementSizeRef(ref);
  const [tiles, setTiles] = useState(initialTiles);
  const { startLayoutTransition } = useLayoutTransition(
    ref,
    LAYOUT_TRANSITION_OPTIONS,
  );
  const isEditable = useEditable();

  const onDelete = useCallback(async (id?: string) => {
    if (!id) {
      return;
    }
    await client.tiles.delete.mutate({ id });
    const element = document.getElementById(id);
    if (element) {
      await destroy(element, {
        timing: { ...DEFAULT_TIMING, fill: "forwards" },
      });
    }
    deleteTile(id);
  }, []);

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
      const { target, dragSource, inside } = event;
      if (ref.current && target instanceof HTMLElement && !inside) {
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
      const { dragSource, inside } = event;
      if (!inside && ref.current) {
        const id = dragSource.id ?? "";
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
        !target.id ||
        !sizeRef.current ||
        !size
      ) {
        return;
      }
      const id = target.id;
      const columnWidth = sizeRef.current.width / 3;
      const columns = Math.round(size.width / columnWidth);
      const rows = Math.round(size.height / columnWidth);
      const tile = tiles.find((tile) => tile.id === id);

      if (!tile) {
        return;
      }

      if (columns !== tile.columns || rows != tile.rows) {
        viewTransition(() => {
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
        !target.id
      ) {
        return;
      }
      const id = target.id;
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
      {tiles.map((tile) => (
        <GridItem
          key={tile.id}
          id={tile.id}
          rows={tile.rows}
          columns={tile.columns}
          isEditable={isEditable}
          onDelete={onDelete}
          grow={tile.type === "TEXT" && tile.columns === 3}
        >
          {getTileComponent(tile)}
        </GridItem>
      ))}
    </section>
  );
}
