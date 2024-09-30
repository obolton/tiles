import { useCallback } from "react";
import { createTile } from "@/utils/edit";
import { handleError } from "@/utils/errors";
import type { DragDropEvent } from "@/utils/drag";

export default function useCreateCollection(
  tileId: string,
  type: "STACK" | "MAP",
) {
  return useCallback(
    (event: DragDropEvent) => {
      const id = event.dragSource.dataset.tileId;
      if (!id) {
        return;
      }
      createTile({
        type: "COLLECTION",
        collection: {
          type,
          tileIds: [tileId, id],
        },
      }).catch(handleError);
    },
    [tileId, type],
  );
}
