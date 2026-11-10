import { flag } from "carillon";

/**
 * Tracks whether an image has loaded. A server-rendered image can finish loading before
 * hydration attaches its `load` listener, so the element is also checked when it is attached.
 */
export function trackImageLoad() {
  const loaded = flag(false);

  return {
    loaded,
    onLoad: () => loaded.on(),
    ref(image: HTMLImageElement) {
      if (image.complete && image.naturalWidth > 0) {
        loaded.on();
      }
    },
  };
}
