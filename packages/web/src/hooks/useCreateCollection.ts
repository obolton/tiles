import { useCallback } from "react";
import { createCollection } from "@/utils/edit";
import { handleError } from "@/utils/errors";
import type { DragDropEvent } from "@/utils/drag";

export default function useCreateCollection(tileId: string) {
  return (event: DragDropEvent) => {
    const id = event.dragSource.dataset.placementId;
    if (!id) {
      return;
    }
    createCollection({
      tileIds: [tileId, id],
    })
      .then(() => {
        window.dispatchEvent(
          new CustomEvent("tile:remove", { detail: [tileId, id] }),
        );
      })
      .catch(handleError);
  };
}
