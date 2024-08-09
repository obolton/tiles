import { useCallback, useRef } from "react";

export default function useDebouncedCallback<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  T extends (...args: any) => ReturnType<T>,
>(callback: T, delay: number, deps: React.DependencyList) {
  const timeout = useRef<ReturnType<typeof setTimeout> | null>();

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeout.current) {
        clearTimeout(timeout.current);
        timeout.current = null;
      }
      timeout.current = setTimeout(() => callback(...args), delay);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [callback, delay, ...deps],
  );
}
