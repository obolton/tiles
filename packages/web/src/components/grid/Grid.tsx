import { useEffect, useState } from "react";
import styles from "./Grid.module.css";
import Tile, { type TileProps } from "../tiles/Tile";

interface GridProps {
  tiles: TileProps[];
  children: React.ReactNode;
}

export default function Grid({ children, tiles: initialTiles }: GridProps) {
  const [tiles, setTiles] = useState(initialTiles);

  useEffect(() => {
    const callback = (event: Event) => {
      const { detail } = event as CustomEvent<{ tile: TileProps }>;
      setTiles((prevTiles) => [...prevTiles, detail.tile]);
    };
    window.addEventListener("tile:add", callback);
    return () => {
      window.removeEventListener("tile:add", callback);
    };
  }, []);

  return (
    <section className={styles.grid}>
      {tiles.map((tile) => (
        <Tile key={tile.id} {...tile} />
      ))}
      {children}
    </section>
  );
}
