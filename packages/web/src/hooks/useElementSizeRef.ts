import { useEffect, useRef } from "react";

export default function useElementSizeRef(ref: React.RefObject<HTMLElement>) {
  const sizeRef = useRef<{ width: number; height: number }>();

  useEffect(() => {
    if (!ref.current) {
      return;
    }

    const initialSize = ref.current.getBoundingClientRect();
    sizeRef.current = { width: initialSize.width, height: initialSize.height };

    const resizeObserver = new ResizeObserver((entries) => {
      const size = entries[0]?.contentBoxSize[0];
      sizeRef.current = size
        ? { width: size.inlineSize, height: size.blockSize }
        : undefined;
    });
    resizeObserver.observe(ref.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [ref]);

  return sizeRef;
}
