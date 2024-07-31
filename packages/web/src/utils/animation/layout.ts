const rects = new WeakMap<HTMLElement, DOMRect>();
const animations = new WeakMap<HTMLElement, Animation>();

function animatePosition(element: HTMLElement) {
  const previousRect = rects.get(element);
  if (!previousRect) {
    return;
  }

  const existingAnimation = animations.get(element);
  if (existingAnimation) {
    existingAnimation.cancel();
    animations.delete(element);
  }

  const rect = element.getBoundingClientRect();
  rects.set(element, rect);

  const deltaX = previousRect.left - rect.left;
  const deltaY = previousRect.top - rect.top;

  if (deltaX === 0 && deltaY === 0) {
    return;
  }

  // Prevent pointer events during the animation
  element.style.setProperty("pointer-events", "none");

  const animation = element.animate(
    [
      { transform: `translate(${deltaX}px, ${deltaY}px)` },
      { transform: "none" },
    ],
    {
      duration: 200,
      easing: "ease-in-out",
    }
  );
  animation.addEventListener(
    "finish",
    () => {
      element.style.removeProperty("pointer-events");
      animations.delete(element);
    },
    { once: true }
  );
  animations.set(element, animation);
}

export function willAnimateLayout(element: HTMLElement) {
  for (const child of element.children) {
    if (child instanceof HTMLElement) {
      rects.set(child, child.getBoundingClientRect());
    }
  }
}

export type AnimateLayoutOptions = {
  attributes?: string[];
};

function animateChildren(element: HTMLElement) {
  for (const child of element.children) {
    if (child instanceof HTMLElement) {
      animatePosition(child);
    }
  }
}

export function animateLayout(
  element: HTMLElement,
  options?: AnimateLayoutOptions,
) {
  const observers: MutationObserver[] = [];

  const childListObserver = new MutationObserver(() =>
    animateChildren(element),
  );
  childListObserver.observe(element, { childList: true });
  observers.push(childListObserver);

  if (options?.attributes && options.attributes.length > 0) {
    const attributesObserver = new MutationObserver(() =>
      animateChildren(element),
    );
    attributesObserver.observe(element, {
      subtree: true,
      attributes: true,
      attributeFilter: options.attributes,
    });
    observers.push(attributesObserver);
  }

  return () => {
    for (const observer of observers) {
      observer.disconnect();
    }
  };
}
