import { startTransition, useCallback, useEffect } from "react";
import { animateLayout, willAnimateLayout } from "@/utils/animation/layout";
import type { AnimateLayoutOptions } from "@/utils/animation/layout";

export type { AnimateLayoutOptions };

export default function useLayoutTransition(
  ref: React.RefObject<HTMLElement | null>,
  options?: AnimateLayoutOptions,
) {
  useEffect(() => {
    if (ref.current) {
      return animateLayout(ref.current, options);
    }
  }, [options, ref]);

  const startLayoutTransition = useCallback(
    (scope: React.TransitionFunction) => {
      if (ref.current) {
        willAnimateLayout(ref.current);
      }
      startTransition(scope);
    },
    [ref],
  );

  return { startLayoutTransition };
}
