import Tile from "./Tile";
import Stack from "./collections/Stack";
import type { ClientCollection } from "@/types/tiles";

type CollectionTileProps = ClientCollection;

export default function CollectionTile({ items }: CollectionTileProps) {
  return (
    <Tile background={false} border="none">
      <Stack items={items} />
    </Tile>
  );
}
