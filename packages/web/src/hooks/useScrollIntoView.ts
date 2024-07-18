import { useEffect } from "react";
import useSessionState from "./useSessionState";
import { set, remove } from "@/utils/state";

const SCROLL_INTO_VIEW_KEY = "SCROLL_INTO_VIEW";

export function scrollIntoView(elementId: string) {
  set(SCROLL_INTO_VIEW_KEY, elementId);
}

export default function useScrollIntoView(ref: React.RefObject<HTMLElement>) {
  const elementId = useSessionState(SCROLL_INTO_VIEW_KEY);
  useEffect(() => {
    if (elementId && elementId === ref.current?.id) {
      ref.current.scrollIntoView({ behavior: "smooth" });
      remove(SCROLL_INTO_VIEW_KEY);
    }
  }, [ref, elementId]);
}
