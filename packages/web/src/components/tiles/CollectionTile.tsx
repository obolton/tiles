import Tile from "./Tile";
import Stack from "./collections/Stack";
import type { ClientCollection } from "@/types/tiles";

export default function CollectionTile({ id, items }: ClientCollection) {
  return (
    <Tile background={false} border="none">
      <Stack id={id} items={items} />
    </Tile>
  );
}
