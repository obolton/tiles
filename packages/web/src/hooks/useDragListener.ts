import { useEffect, useState } from "react";
import type { DragDropEvent } from "@/utils/drag";
import type { ClientTile } from "@/types/tiles";

export default function useDragListener() {
  const [dragId, setDragId] = useState<string | null>(null);

  useEffect(() => {
    const abortController = new AbortController();
    addEventListener(
      "dnd-dragstart",
      (event: DragDropEvent<ClientTile>) =>
        setDragId(event.state.data?.placementId ?? null),
      { signal: abortController.signal, passive: true },
    );
    addEventListener("dnd-dragend", () => setDragId(null), {
      signal: abortController.signal,
    });
    return () => abortController.abort();
  }, []);

  return dragId;
}
