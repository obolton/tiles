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
    dampingFactor = 0.5,
    timing = { duration: 500, easing: "ease" },
  }: { origin: Element; dampingFactor?: number; timing?: EffectTiming },
) {
  const originRect = origin.getBoundingClientRect();
  const originCenter = getCenter(originRect);
  const rect = element.getBoundingClientRect();
  const center = getCenter(rect);
  const translateX = (originCenter.x - center.x) * dampingFactor;
  const translateY = (originCenter.y - center.y) * dampingFactor;
  const insetX = ((rect.width - originRect.width) / 2) * dampingFactor;
  const insetY = ((rect.height - originRect.height) / 2) * dampingFactor;
  const style = getComputedStyle(origin);
  const borderRadius = style.getPropertyValue("border-radius");

  const animation = element.animate(
    [
      {
        translate: `${translateX}px ${translateY}px`,
        clipPath: `inset(${insetY}px ${insetX}px round ${borderRadius})`,
        opacity: 0,
      },
      {
        translate: "none",
        clipPath: "inset(0)",
        opacity: 1,
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
