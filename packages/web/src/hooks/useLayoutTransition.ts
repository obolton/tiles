import { startTransition, useCallback, useEffect } from "react";
import { animateLayout, willAnimateLayout } from "../utils/animation";

export default function useLayoutTransition(ref: React.RefObject<HTMLElement>) {
  useEffect(() => {
    if (ref.current) {
      return animateLayout(ref.current);
    }
  }, [ref]);

  const startLayoutTransition = useCallback(
    (scope: React.TransitionFunction) => {
      if (ref.current) {
        willAnimateLayout(ref.current);
      }
      startTransition(scope);
    },
    [ref]
  );

  return { startLayoutTransition };
}
