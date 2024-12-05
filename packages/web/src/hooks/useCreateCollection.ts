import { useCallback } from "react";
import { createCollection } from "@/utils/edit";
import { handleError } from "@/utils/errors";
import type { DragDropEvent } from "@/utils/drag";

export default function useCreateCollection(tileId: string, type: "STACK") {
  return useCallback(
    (event: DragDropEvent) => {
      const id = event.dragSource.id;
      if (!id) {
        return;
      }
      createCollection({
        type,
        tileIds: [tileId, id],
      })
        .then(() => {
          window.dispatchEvent(
            new CustomEvent("tile:remove", { detail: [tileId, id] }),
          );
        })
        .catch(handleError);
    },
    [tileId, type],
  );
}
