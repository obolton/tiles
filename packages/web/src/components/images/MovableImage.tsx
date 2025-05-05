import { classNames } from "@/utils/css";
import styles from "./MovableImage.module.css";
import type { JSX } from "@/jsx/jsx";
import type { Store } from "@/utils/stores";

type Origin = { x: number; y: number };

interface MovableImageProps extends JSX.Attributes<HTMLImageElement> {
  movable?: Store<boolean>;
  origin: Store<Origin>;
  onMove: (origin: Origin) => void;
  onRelease: (origin: Origin) => void;
}

export default function MovableImage({
  className,
  movable,
  onMove,
  onRelease,
  origin,
  ...props
}: MovableImageProps) {
  const onPointerDown = (event: PointerEvent) => {
    const image = event.currentTarget as HTMLImageElement;
    if (!image) {
      return;
    }

    event.preventDefault();

    const initialPointerX = event.pageX;
    const initialPointerY = event.pageY;
    const initialX = origin.value.x;
    const initialY = origin.value.y;
    const scale = Math.max(
      image.width / image.naturalWidth,
      image.height / image.naturalHeight,
    );
    const width = image.naturalWidth * scale;
    const height = image.naturalHeight * scale;

    let originX = initialX;
    let originY = initialY;

    const abortController = new AbortController();

    addEventListener(
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

    addEventListener(
      "pointerup",
      () => {
        abortController.abort();
        onRelease({ x: originX, y: originY });
      },
      { once: true },
    );
  };

  return (
    <img
      className={classNames(movable && styles.movable, className)}
      onpointerdown={onPointerDown}
      {...props}
    />
  );
}
