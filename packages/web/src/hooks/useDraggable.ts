import { useEffect } from "react";
import { makeDraggable } from "../utils/drag";

export default function useDraggable(
  ref: React.RefObject<HTMLElement>,
  draggable: boolean
) {
  useEffect(() => {
    if (ref.current && draggable) {
      return makeDraggable(ref.current);
    }
  }, [draggable]);
}
