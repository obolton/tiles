import { appearFrom, moveFrom, moveTo, fadeOut } from "./animation/effects";

let lightbox: HTMLDialogElement | null = null;
let currentIndex = 0;

function intersectionObserverCallback(entries: IntersectionObserverEntry[]) {
  if (!lightbox?.firstChild) {
    return null;
  }
  for (const entry of entries) {
    if (entry.isIntersecting) {
      currentIndex = Array.prototype.indexOf.call(
        lightbox.firstChild.childNodes,
        entry.target,
      );
      return;
    }
  }
}

function openLightbox(element: Element) {
  if (lightbox) {
    throw new Error("Lightbox is already open");
  }

  lightbox = document.createElement("dialog");
  lightbox.dataset.lightbox = "true";
  lightbox.classList.add("lightbox");
  const list = document.createElement("ol");
  lightbox.appendChild(list);

  const observer = new IntersectionObserver(intersectionObserverCallback, {
    root: list,
    rootMargin: "-50% 0% -50% 0%",
    threshold: 0,
  });

  // Add eligible items
  const eligibleItems = Array.from(
    element.parentElement?.querySelectorAll('[data-show-in-lightbox="true"]') ||
      [],
  );
  const fragment = document.createDocumentFragment();
  eligibleItems.forEach((content) => {
    const item = createItem(content);
    fragment.appendChild(item);
    observer.observe(item);
  });
  list.appendChild(fragment);
  currentIndex = eligibleItems.indexOf(element);

  // Handle interactions
  lightbox.addEventListener("click", () => lightbox?.close());
  lightbox.addEventListener("keydown", keyDown);
  lightbox.addEventListener(
    "close",
    () => {
      observer.disconnect();

      // Animate out the visible items
      const visible = list.children[currentIndex];
      const previous = list.children[currentIndex - 1];
      const next = list.children[currentIndex + 1];

      if (visible.firstElementChild) {
        fadeOut(visible.firstElementChild);
      }
      if (previous) {
        moveTo(previous, { y: "-5vh" });
      }
      if (next) {
        moveTo(next, { y: "5vh" });
      }

      Promise.all(
        lightbox?.getAnimations().map((animation) => animation.finished) ?? [],
      ).finally(() => {
        lightbox?.remove();
        lightbox = null;
      });
    },
    { once: true },
  );

  // Add the lightbox to the document
  document.body.appendChild(lightbox);
  lightbox.showModal();
  list.children[currentIndex].scrollIntoView({
    behavior: "instant",
    block: "center",
  });

  // Animate in the visible items
  const visible = list.children[currentIndex];
  const previous = list.children[currentIndex - 1];
  const next = list.children[currentIndex + 1];

  if (visible.firstElementChild) {
    appearFrom(visible.firstElementChild, {
      origin: element,
      endClipPath: "inset(0 -20vw 0 0)",
    });
  }
  if (previous) {
    moveFrom(previous, { y: "-5vh" });
  }
  if (next) {
    moveFrom(next, { y: "5vh" });
  }
}

function createItem(element: Element) {
  const content = element.cloneNode(true) as HTMLElement;
  content.classList.remove("editable");

  // Clear attributes
  for (const attribute in content.dataset) {
    delete content.dataset[attribute];
  }
  content.removeAttribute("style");

  const item = document.createElement("li");
  item.addEventListener("click", itemClick);
  item.appendChild(content);
  return item;
}

function itemClick(event: MouseEvent) {
  event.preventDefault();
  event.stopPropagation();
  (event.currentTarget as Element).scrollIntoView({
    behavior: "smooth",
    block: "center",
  });
}

function keyDown(event: KeyboardEvent) {
  const items = lightbox?.firstElementChild?.children;
  if (
    items &&
    ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(event.key)
  ) {
    event.preventDefault();
    event.stopPropagation();

    if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
      currentIndex = Math.max(0, currentIndex - 1);
    } else if (
      event.key === "ArrowDown" ||
      event.key === "ArrowRight" ||
      event.key === " "
    ) {
      currentIndex = Math.min(items.length - 1, currentIndex + 1);
    }

    items[currentIndex]?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }
}

function click(event: MouseEvent) {
  if (!(event.target instanceof Element) || document.body.dataset.editing) {
    return;
  }
  const element = event.target.closest("[data-show-in-lightbox]");
  if (element) {
    event.preventDefault();
    event.stopPropagation();
    openLightbox(element);
  }
}

export function initialize() {
  document.body.addEventListener("click", click);
}
