import { flushSync } from "react-dom";
import { createAnimationPromise, SPRING } from "./effects";

interface LayoutTransitionEntry {
  id: string;
  beforeRect: DOMRect;
}

const pendingAnimations = new Set<Animation>();

async function animateEntry({ id, beforeRect }: LayoutTransitionEntry) {
  const element = document.querySelector<HTMLElement>(
    `[data-animate-layout-id="${id}"]`,
  );
  if (!element) {
    return Promise.resolve();
  }

  const rect = element.getBoundingClientRect();
  const deltaX = Math.round(beforeRect.left - rect.left);
  const deltaY = Math.round(beforeRect.top - rect.top);

  if (deltaX === 0 && deltaY === 0) {
    return;
  }

  const animation = element.animate(
    [{ translate: `${deltaX}px ${deltaY}px` }, { translate: "none" }],
    SPRING,
  );
  const promise = createAnimationPromise(animation);
  promise.finally(() => pendingAnimations.delete(animation));
  pendingAnimations.add(animation);
  return promise;
}

function getEntries() {
  const elements = document.querySelectorAll("[data-animate-layout-id]");
  const entries: LayoutTransitionEntry[] = [];
  for (const element of elements) {
    if (element instanceof HTMLElement && element.dataset.animateLayoutId) {
      entries.push({
        id: element.dataset.animateLayoutId,
        beforeRect: element.getBoundingClientRect(),
      });
    }
  }
  return entries;
}

export function layoutTransition(updateLayout: () => void) {
  const entries = getEntries();
  flushSync(() => {
    updateLayout();
  });
  pendingAnimations.forEach((animation) => animation.cancel());
  pendingAnimations.clear();
  return Promise.all(entries.map(animateEntry));
}
