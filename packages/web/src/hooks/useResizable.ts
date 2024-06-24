import { useEffect } from "react";
import { makeResizable } from "../utils/resize";

export default function useResizable(
  ref: React.RefObject<HTMLElement>,
  resizable: boolean
) {
  useEffect(() => {
    if (ref.current && resizable) {
      return makeResizable(ref.current);
    }
  }, [ref, resizable]);
}
