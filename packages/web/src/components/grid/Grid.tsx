import { useEffect, useState } from "react";
import styles from "./Grid.module.css";
import Tile from "../tiles/Tile";
import type { Tile as TileData } from "../../types/tiles";

interface GridProps {
  tiles: TileData[];
  children: React.ReactNode;
}

export default function Grid({ children, tiles: initialTiles }: GridProps) {
  const [tiles, setTiles] = useState(initialTiles);

  useEffect(() => {
    const callback = (event: Event) => {
      const {
        detail: { tile },
      } = event as CustomEvent<{ tile: TileData }>;
      if (tile.id) {
        setTiles((prevTiles) =>
          prevTiles.map((prevTile) =>
            prevTile.id === tile.id ? tile : prevTile
          )
        );
      } else {
        setTiles((prevTiles) => [...prevTiles, tile]);
      }
    };
    window.addEventListener("tile:update", callback);
    return () => {
      window.removeEventListener("tile:update", callback);
    };
  }, []);

  return (
    <section className={styles.grid}>
      {tiles.map((tile) => (
        <Tile key={tile.id} tile={tile} />
      ))}
      {children}
    </section>
  );
}
