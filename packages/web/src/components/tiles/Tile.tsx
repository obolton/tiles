import styles from "./Tile.module.css";
import type { ClassList } from "@/jsx/html-attributes";
import type { JSX } from "@/jsx/jsx";

export type TileProps = {
  classList?: ClassList;
  children?: JSX.Node;
  anchorName?: string;
};

export default function Tile({ classList, children, anchorName }: TileProps) {
  return (
    <div
      classList={{ [styles.tile]: true, ...classList }}
      style={{ anchorName }}
    >
      {children}
    </div>
  );
}
