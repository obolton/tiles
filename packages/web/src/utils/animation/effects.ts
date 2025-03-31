export const DEFAULT_TIMING: EffectTiming = {
  duration: 350,
  easing: "ease",
};

export const SPRING: EffectTiming = {
  duration: 350,
  easing:
    "linear(0, 0.0018, 0.0071 1.18%, 0.0267 2.37%, 0.0931, 0.1827 7.11%, 0.5325 15.4%, 0.6401, 0.7317, 0.8068, 0.8664, 0.9123, 0.9464, 0.9709 36.14%, 0.9905, 1.0022 43.25%, 1.0094 47.99%, 1.0109 54.51%, 1.0021, 0.9999 99.54%)",
};

export function createAnimationPromise(animation: Animation) {
  return new Promise((resolve) => {
    animation.addEventListener("finish", resolve);
    animation.addEventListener("cancel", resolve);
  });
}

export function destroy(
  element: Element,
  { timing = DEFAULT_TIMING }: { timing: EffectTiming } = {
    timing: DEFAULT_TIMING,
  },
) {
  const rect = element.getBoundingClientRect();
  const clone = element.cloneNode(true) as HTMLElement;
  clone.style.setProperty("position", "fixed");
  clone.style.setProperty("top", `${rect.top}px`);
  clone.style.setProperty("left", `${rect.left}px`);
  clone.style.setProperty("width", `${rect.width}px`);
  clone.style.setProperty("height", `${rect.height}px`);
  clone.style.setProperty("z-index", "-1");
  clone.querySelectorAll("[popover]").forEach((popover) => popover.remove());
  document.body.appendChild(clone);
  const animation = clone.animate(
    [
      {
        opacity: 1,
        scale: 1,
        filter: "blur(0)",
      },
      {
        opacity: 0,
        scale: 0.3,
        filter: "blur(5px)",
      },
    ],
    timing,
  );
  const promise = createAnimationPromise(animation);
  promise.finally(() => clone.remove());
  return promise;
}

export function move(
  element: Element,
  {
    fromX = "0",
    fromY = "0",
    toX = "0",
    toY = "0",
    timing = SPRING,
  }: {
    fromX?: string;
    fromY?: string;
    toX?: string;
    toY?: string;
    timing?: EffectTiming;
  },
) {
  const animation = element.animate(
    [{ translate: `${fromX} ${fromY}` }, { translate: `${toX} ${toY}` }],
    timing,
  );
  return createAnimationPromise(animation);
}

export function moveFrom(
  element: Element,
  {
    x = "0",
    y = "0",
    timing = SPRING,
  }: { x?: string; y?: string; timing?: EffectTiming },
) {
  const animation = element.animate(
    [{ translate: `${x} ${y}` }, { translate: "none" }],
    timing,
  );
  return createAnimationPromise(animation);
}

export function moveTo(
  element: Element,
  {
    x = "0",
    y = "0",
    timing = SPRING,
  }: { x?: string; y?: string; timing?: EffectTiming },
) {
  const animation = element.animate(
    [{ translate: "none" }, { translate: `${x} ${y}` }],
    timing,
  );
  return createAnimationPromise(animation);
}

export function fadeIn(
  element: Element,
  { timing = DEFAULT_TIMING } = { timing: DEFAULT_TIMING },
) {
  const animation = element.animate([{ opacity: 0 }, { opacity: 1 }], timing);
  return createAnimationPromise(animation);
}

export function fadeOut(
  element: Element,
  { timing = DEFAULT_TIMING } = { timing: DEFAULT_TIMING },
) {
  const animation = element.animate([{ opacity: 1 }, { opacity: 0 }], timing);
  return createAnimationPromise(animation);
}
