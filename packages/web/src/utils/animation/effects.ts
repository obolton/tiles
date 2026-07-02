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
  { x = "0", y = "0", timing = SPRING }: { x?: string; y?: string; timing?: EffectTiming },
) {
  const animation = element.animate([{ translate: `${x} ${y}` }, { translate: "none" }], timing);
  return createAnimationPromise(animation);
}

export function moveTo(
  element: Element,
  { x = "0", y = "0", timing = SPRING }: { x?: string; y?: string; timing?: EffectTiming },
) {
  const animation = element.animate([{ translate: "none" }, { translate: `${x} ${y}` }], timing);
  return createAnimationPromise(animation);
}

export function fadeIn(element: Element, { timing = DEFAULT_TIMING } = { timing: DEFAULT_TIMING }) {
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

export function pulse(
  element: Element,
  {
    scale = 1.03,
    timing = DEFAULT_TIMING,
  }: { scale?: number; timing?: EffectTiming } = {},
) {
  const animation = element.animate(
    [{ scale: "1" }, { scale: `${scale}` }, { scale: "1" }],
    timing,
  );
  return createAnimationPromise(animation);
}
