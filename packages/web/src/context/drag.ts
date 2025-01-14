import { createContext, useContext } from "react";

export const DragIdContext = createContext<string | null>(null);
DragIdContext.displayName = "DragIdContext";

export function useDragId() {
  return useContext(DragIdContext);
}
