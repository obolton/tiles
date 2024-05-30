import { useEffect, useState } from "react";
import styles from "./Grid.module.css";
import Tile from "../tiles/Tile";
import type { ClientTile } from "../../types/tiles";

interface GridProps {
  tiles: ClientTile[];
  children: React.ReactNode;
}

export default function Grid({ children, tiles: initialTiles }: GridProps) {
  const [tiles, setTiles] = useState(initialTiles);

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
      const {
    };
    window.addEventListener("tile:create", create);
    window.addEventListener("tile:update", update);
    return () => {
      window.removeEventListener("tile:create", create);
      window.removeEventListener("tile:update", update);
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
