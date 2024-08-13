import { getCenter } from "../geometry";

const DEFAULT_TIMING: EffectTiming = {
  duration: 500,
  easing: "ease",
  fill: "forwards",
};

function createAnimationPromise(animation: Animation) {
  return new Promise((resolve, reject) => {
    animation.addEventListener("finish", resolve);
    animation.addEventListener("cancel", reject);
  });
}

export function destroy(
  element: Element,
  { timing = DEFAULT_TIMING }: { timing: EffectTiming } = {
    timing: DEFAULT_TIMING,
  },
) {
  const animation = element.animate(
    [
      {
        opacity: 1,
        transform: "scale(1)",
        filter: "blur(0)",
      },
      {
        opacity: 0,
        transform: "scale(0.3)",
        filter: "blur(5px)",
      },
    ],
    timing,
  );
  return createAnimationPromise(animation);
}

export function appearFrom(
  element: Element,
  {
    origin,
    endClipPath = "inset(0)",
    timing = { duration: 500, easing: "ease" },
  }: { origin: Element; endClipPath?: string; timing?: EffectTiming },
) {
  const originRect = origin.getBoundingClientRect();
  const originCenter = getCenter(originRect);
  const rect = element.getBoundingClientRect();
  const center = getCenter(rect);
  const borderRadius =
    getComputedStyle(origin).getPropertyValue("border-radius");

  const translateX = originCenter.x - center.x;
  const translateY = originCenter.y - center.y;

  const scale = Math.max(
    originRect.width / rect.width,
    originRect.height / rect.height,
  );

  const scaledWidth = originRect.width / scale;
  const scaledHeight = originRect.height / scale;

  const insetX = (rect.width - scaledWidth) / 2;
  const insetY = (rect.height - scaledHeight) / 2;

  const animation = element.animate(
    [
      {
        translate: `${translateX}px ${translateY}px`,
        clipPath: `inset(${insetY}px ${insetX}px round calc(${borderRadius} / ${scale}))`,
        transform: `scale(${scale})`,
      },
      {
        translate: "none",
        clipPath: endClipPath,
        transform: "scale(1)",
      },
    ],
    timing,
  );
  return createAnimationPromise(animation);
}

export function moveFrom(
  element: Element,
  {
    x = "0",
    y = "0",
    timing = { duration: 500, easing: "ease" },
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
    timing = { duration: 500, easing: "ease" },
  }: { x?: string; y?: string; timing?: EffectTiming },
) {
  const animation = element.animate(
    [{ translate: "none" }, { translate: `${x} ${y}` }],
    timing,
  );
  return createAnimationPromise(animation);
}

export function fadeOut(
  element: Element,
  { timing = DEFAULT_TIMING } = { timing: DEFAULT_TIMING },
) {
  const animation = element.animate([{ opacity: 1 }, { opacity: 0 }], timing);
  return createAnimationPromise(animation);
}
