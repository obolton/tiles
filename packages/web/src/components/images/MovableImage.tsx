import styles from "./MovableImage.module.css";
import type { JSX } from "jsx/jsx";
import type { Reactive } from "reactivity";

export type Origin = { x: number; y: number };

export interface MovableImageProps extends JSX.Attributes<"img"> {
  movable?: Reactive<boolean>;
  origin: Reactive<Origin>;
  onMove: (origin: Origin) => void;
  onRelease: (origin: Origin) => void;
  signal?: AbortSignal;
}

export default function MovableImage({
  movable,
  origin,
  onMove,
  onRelease,
  signal,
  ...props
}: MovableImageProps) {
  const onPointerDown = (event: PointerEvent) => {
    if (!movable || !movable.value) {
      return;
    }

    event.preventDefault();

    const image = event.currentTarget as HTMLImageElement;

    const initialPointerX = event.pageX;
    const initialPointerY = event.pageY;
    const initialX = origin.value.x;
    const initialY = origin.value.y;
    const scale = Math.max(image.width / image.naturalWidth, image.height / image.naturalHeight);
    const width = image.naturalWidth * scale;
    const height = image.naturalHeight * scale;

    let originX = initialX;
    let originY = initialY;

    const abortController = new AbortController();
    const abortSignal = signal
      ? AbortSignal.any([signal, abortController.signal])
      : abortController.signal;

    addEventListener(
      "pointermove",
      (event) => {
        const deltaX = (event.pageX - initialPointerX) / width;
        const deltaY = (event.pageY - initialPointerY) / height;
        originX = Math.min(Math.max(initialX - deltaX, 0), 1);
        originY = Math.min(Math.max(initialY - deltaY, 0), 1);
        onMove({ x: originX, y: originY });
      },
      { passive: true, signal: abortSignal },
    );

    addEventListener(
      "pointerup",
      () => {
        abortController.abort();
        onRelease({ x: originX, y: originY });
      },
      { once: true, signal: abortSignal },
    );
  };

  return (
    <img
      classList={{ [styles.movable]: movable }}
      on:pointerdown={movable ? onPointerDown : undefined}
      {...props}
    />
  );
}
