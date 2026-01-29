import styles from "./Tile.module.css";
import type { JSX } from "@/jsx/jsx";

export type TileProps = {
  className?: string;
  children?: JSX.Node;
  anchorName?: string;
};

export default function Tile({ className, children, anchorName }: TileProps) {
  return (
    <div classList={[styles.tile, className]} style={{ anchorName }}>
      {children}
    </div>
  );
}
