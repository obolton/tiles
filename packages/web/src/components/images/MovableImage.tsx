import { useCallback, useRef } from "react";
import { classNames } from "@/utils/css";
import styles from "./MovableImage.module.css";

type Origin = { x: number; y: number };

interface MovableImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  movable?: boolean;
  origin: Origin;
  onMove: (origin: Origin) => void;
  onRelease: (origin: Origin) => void;
}

export default function MovableImage({
  className,
  movable = true,
  onMove,
  onRelease,
  origin,
  ...props
}: MovableImageProps) {
  const ref = useRef<HTMLImageElement>(null);
  const onPointerDown = useCallback(
    (event: React.PointerEvent) => {
      const image = ref.current;
      if (!image) {
        return;
      }

      event.stopPropagation();
      event.preventDefault();

      const initialPointerX = event.pageX;
      const initialPointerY = event.pageY;
      const initialX = origin.x;
      const initialY = origin.y;
      const scale = Math.max(
        image.width / image.naturalWidth,
        image.height / image.naturalHeight,
      );
      const width = image.naturalWidth * scale;
      const height = image.naturalHeight * scale;

      let originX = initialX;
      let originY = initialY;

      const abortController = new AbortController();

      window.addEventListener(
        "pointermove",
        (event) => {
          const deltaX = (event.pageX - initialPointerX) / width;
          const deltaY = (event.pageY - initialPointerY) / height;
          originX = Math.min(Math.max(initialX - deltaX, 0), 1);
          originY = Math.min(Math.max(initialY - deltaY, 0), 1);
          onMove({ x: originX, y: originY });
        },
        { passive: true, signal: abortController.signal },
      );

      window.addEventListener(
        "pointerup",
        async () => {
          abortController.abort();
          onRelease({ x: originX, y: originY });
        },
        { once: true },
      );
    },
    [onMove, onRelease, origin.x, origin.y],
  );

  return (
    <img
      ref={ref}
      className={classNames(movable && styles.movable, className)}
      onPointerDownCapture={movable ? onPointerDown : undefined}
      {...props}
    />
  );
}
