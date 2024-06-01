import { useEffect, useRef, useState } from "react";
import styles from "./Grid.module.css";
import Tile from "../tiles/Tile";
import { moveElement } from "../../utils/arrays";
import useLayoutTransition from "../../hooks/useLayoutTransition";
import client from "../../api/client";
import type { ClientTile } from "../../types/tiles";

interface GridProps {
  pageId: string;
  tiles: ClientTile[];
  children: React.ReactNode;
}

export default function Grid({
  children,
  pageId,
  tiles: initialTiles,
}: GridProps) {
  const ref = useRef<HTMLElement>(null);
  const [tiles, setTiles] = useState(initialTiles);
  const { startLayoutTransition } = useLayoutTransition(ref);

  useEffect(() => {
    const create = (event: Event) => {
      const { detail: tile } = event as CustomEvent<ClientTile>;
      setTiles((prevTiles) => [...prevTiles, tile]);
    };
    const update = (event: Event) => {
      const { detail: tile } = event as CustomEvent<ClientTile>;
      setTiles((prevTiles) =>
        prevTiles.map((prevTile) => (prevTile.id === tile.id ? tile : prevTile))
      );
    };
    const dragOver = (event: Event) => {
      const {
        detail: { dragSource },
      } = event as CustomEvent<{ dragSource: HTMLElement }>;
      const dropTarget = event.target;
      if (
        ref.current &&
        dragSource instanceof HTMLElement &&
        dropTarget instanceof HTMLElement
      ) {
        const fromPosition = Array.prototype.indexOf.call(
          ref.current.children,
          dragSource
        );
        const toPosition = Array.prototype.indexOf.call(
          ref.current.children,
          dropTarget
        );
        startLayoutTransition(() => {
          setTiles((prevTiles) =>
            moveElement(prevTiles, fromPosition, toPosition)
          );
        });
      }
    };
    const drop = async (event: Event) => {
      const { target: dragSource } = event;
      if (ref.current && dragSource instanceof HTMLElement) {
        const id = dragSource.dataset.tileId ?? "";
        const position = Array.prototype.indexOf.call(
          ref.current.children,
          dragSource
        );
        await client.tiles.move.mutate({ id, pageId, position });
      }
    };
    window.addEventListener("tile:create", create);
    window.addEventListener("tile:update", update);
    window.addEventListener("drag-over", dragOver);
    window.addEventListener("drop", drop);
    return () => {
      window.removeEventListener("tile:create", create);
      window.removeEventListener("tile:update", update);
      window.removeEventListener("drag-over", dragOver);
      window.removeEventListener("drop", drop);
    };
  }, []);

  return (
    <section className={styles.grid} ref={ref}>
      {tiles.map((tile) => (
        <Tile key={tile.id} pageId={pageId} tile={tile} />
      ))}
      {children}
    </section>
  );
}
