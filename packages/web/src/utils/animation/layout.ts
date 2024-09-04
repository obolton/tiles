const rects = new WeakMap<HTMLElement, DOMRect>();
const animations = new WeakMap<HTMLElement, Animation>();
const transitionElements = new WeakMap<HTMLElement, HTMLElement>();

export type AnimateLayoutOptions = {
  attributes?: string[];
  size?: boolean;
};

function animatePosition(element: HTMLElement, options?: AnimateLayoutOptions) {
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

  const deltaX = Math.round(previousRect.left - rect.left);
  const deltaY = Math.round(previousRect.top - rect.top);
  const deltaWidth = Math.round(previousRect.width - rect.width);
  const deltaHeight = Math.round(previousRect.height - rect.height);

  if (deltaX === 0 && deltaY === 0 && deltaWidth === 0 && deltaHeight === 0) {
    return;
  }

  // If performing a resize transition, animate a clone of the element to prevent layout thrashing
  if (options?.size && (deltaWidth || deltaHeight)) {
    let clone = transitionElements.get(element);

    if (!clone) {
      clone = element.cloneNode(true) as HTMLElement;
      clone.setAttribute("inert", "");
      clone.style.setProperty("top", `${rect.top + window.scrollY}px`);
      clone.style.setProperty("left", `${rect.left + window.scrollX}px`);
      clone.style.setProperty("width", `${previousRect.width}px`);
      clone.style.setProperty("height", `${previousRect.height}px`);

      delete clone.dataset.resizing;
      clone.dataset.resizePreview = "true";

      // If the transition completes, remove the clone and show the original element
      clone.addEventListener(
        "transitionend",
        (event) => {
          if (
            event.propertyName === "width" ||
            event.propertyName === "height"
          ) {
            (event.currentTarget as HTMLElement).remove();
            transitionElements.delete(element);
            element.style.removeProperty("visibility");
          }
        },
        { passive: true },
      );

      transitionElements.set(element, clone);
      document.body.appendChild(clone);

      // Temporarily hide the original element
      element.style.setProperty("visibility", "hidden");
    }

    requestAnimationFrame(() => {
      clone.style.setProperty("width", `${rect.width}px`);
      clone.style.setProperty("height", `${rect.height}px`);
    });
  }

  // Prevent pointer events during the animation
  element.style.setProperty("pointer-events", "none");

  const animation = element.animate(
    [
      { transform: `translate(${deltaX}px, ${deltaY}px)` },
      { transform: "none" },
    ],
    {
      duration: 500,
      easing: "ease",
    },
  );
  animation.addEventListener(
    "finish",
    () => {
      element.style.removeProperty("pointer-events");
      animations.delete(element);
    },
    { once: true },
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

export function animateChildren(
  element: HTMLElement,
  options?: AnimateLayoutOptions,
) {
  for (const child of element.children) {
    if (child instanceof HTMLElement) {
      animatePosition(child, options);
    }
  }
}

export function animateLayout(
  element: HTMLElement,
  options?: AnimateLayoutOptions,
) {
  const observers: MutationObserver[] = [];

  const childListObserver = new MutationObserver(() =>
    animateChildren(element, options),
  );
  childListObserver.observe(element, { childList: true });
  observers.push(childListObserver);

  if (options?.attributes && options.attributes.length > 0) {
    const attributesObserver = new MutationObserver(() =>
      animateChildren(element, options),
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
