import { viewTransition } from "./transitions";
import { scrollIntoViewIfNeeded, smoothScrollBehavior } from "./scroll";
import { moveTo, moveFrom } from "./animation/effects";

const TRANSITION = "lightbox";
const CAPTION_TRANSITION = "lightbox-caption";

let lightbox: HTMLDialogElement | null = null;
let currentIndex = 0;

function intersectionObserverCallback(entries: IntersectionObserverEntry[]) {
  if (!lightbox?.firstElementChild) {
    return null;
  }
  for (const entry of entries) {
    if (entry.isIntersecting) {
      currentIndex = Array.prototype.indexOf.call(
        lightbox.firstElementChild.children,
        entry.target,
      );

      lightbox
        .querySelectorAll("li.visible")
        .forEach((element) => element.classList.remove("visible"));
      entry.target.classList.add("visible");

      if (currentIndex === 0) {
        lightbox.classList.add("first");
      } else {
        lightbox.classList.remove("first");
      }

      if (currentIndex === lightbox.firstElementChild.childElementCount - 1) {
        lightbox.classList.add("last");
      } else {
        lightbox.classList.remove("last");
      }
      return;
    }
  }
}

function openLightbox(element: HTMLElement) {
  if (lightbox) {
    throw new Error("Lightbox is already open");
  }

  lightbox = document.createElement("dialog");
  lightbox.dataset.lightbox = "true";
  lightbox.classList.add("lightbox");

  const list = document.createElement("ol");

  const closeButton = document.createElement("button");
  closeButton.setAttribute("type", "button");
  closeButton.setAttribute("aria-label", "Close");
  closeButton.setAttribute("id", "close-lightbox");
  closeButton.addEventListener("click", () => lightbox?.close());

  lightbox.append(list, closeButton);

  const observer = new IntersectionObserver(intersectionObserverCallback, {
    root: list,
    rootMargin: "-50% 0% -50% 0%",
    threshold: 0,
  });

  // Add eligible items
  const eligibleItems = Array.from(document.querySelectorAll('[data-show-in-lightbox="true"]'));
  const fragment = document.createDocumentFragment();
  eligibleItems.forEach((content) => {
    const item = createItem(content);
    fragment.appendChild(item);
    observer.observe(item);
  });
  list.appendChild(fragment);
  currentIndex = eligibleItems.indexOf(element);

  if (currentIndex === 0) {
    lightbox.classList.add("first");
  }
  if (currentIndex === eligibleItems.length - 1) {
    lightbox.classList.add("last");
  }
  list.children[currentIndex]?.classList.add("visible");

  // Handle interactions
  lightbox.addEventListener("pointerdown", () => lightbox?.close());
  lightbox.addEventListener("keydown", keyDown);
  lightbox.addEventListener(
    "close",
    () => {
      observer.disconnect();

      // Animate out the visible items
      const element = list.children[currentIndex]?.firstElementChild as HTMLElement;

      const previous = list.children[currentIndex - 1]?.firstElementChild as
        | HTMLElement
        | undefined;
      const next = list.children[currentIndex + 1]?.firstElementChild as HTMLElement | undefined;

      if (previous) {
        void moveTo(previous, { y: "-6vh" });
      }
      if (next) {
        void moveTo(next, { y: "6vh" });
      }

      const relatedId = element.getAttribute("data-related");
      const relatedElement = relatedId ? document.getElementById(relatedId) : null;

      const image = element.querySelector("img");
      const caption = element.querySelector("figcaption");
      const relatedImage = relatedElement?.querySelector("img");
      const relatedCaption = relatedElement?.querySelector("figcaption");

      if (relatedElement) {
        scrollIntoViewIfNeeded(relatedElement, {
          behavior: "instant",
          block: "center",
        });
      }

      requestAnimationFrame(() => {
        if (image) {
          image.style.viewTransitionName = TRANSITION;
        }
        if (caption) {
          caption.style.viewTransitionName = CAPTION_TRANSITION;
        }

        const rootStyle = document.documentElement.style;
        rootStyle.setProperty(
          "--view-transition-object-position",
          originalImage?.style.objectPosition || "center",
        );
        rootStyle.setProperty("--view-transition-new-object-fit", "contain");
        rootStyle.setProperty("--view-transition-old-object-fit", "cover");
        rootStyle.setProperty("--view-transition-animation-direction", "reverse");

        const transition = viewTransition(() => {
          image?.remove();
          if (relatedImage) {
            relatedImage.style.viewTransitionName = TRANSITION;
          }

          caption?.remove();
          if (relatedCaption) {
            relatedCaption.style.viewTransitionName = CAPTION_TRANSITION;
          }

          lightbox?.close();
        });
        void transition.finished.finally(() => {
          relatedImage?.style.removeProperty("view-transition-name");
          relatedCaption?.style.removeProperty("view-transition-name");
          rootStyle.removeProperty("--view-transition-object-position");
          rootStyle.removeProperty("--view-transition-new-object-fit");
          rootStyle.removeProperty("--view-transition-old-object-fit");
          rootStyle.removeProperty("--view-transition-animation-direction");
          lightbox?.remove();
          lightbox = null;
        });
      });
    },
    { once: true },
  );

  const originalImage = element.querySelector("img");
  if (originalImage) {
    originalImage.style.viewTransitionName = TRANSITION;
  }

  const originalCaption = element.querySelector("figcaption");
  if (originalCaption) {
    originalCaption.style.viewTransitionName = CAPTION_TRANSITION;
  }

  const rootStyle = document.documentElement.style;
  rootStyle.setProperty(
    "--view-transition-object-position",
    originalImage?.style.objectPosition || "center",
  );
  rootStyle.setProperty("--view-transition-new-object-fit", "cover");
  rootStyle.setProperty("--view-transition-old-object-fit", "contain");

  const visibleItem = list.children[currentIndex];
  const image = visibleItem?.querySelector("img");
  const caption = visibleItem?.querySelector("figcaption");

  const previous = visibleItem?.previousElementSibling;
  const next = visibleItem?.nextElementSibling;

  if (previous instanceof HTMLElement) {
    void moveFrom(previous, { y: "-6vh" });
  }
  if (next instanceof HTMLElement) {
    void moveFrom(next, { y: "6vh" });
  }

  // Add the lightbox to the document
  const transition = viewTransition(() => {
    originalImage?.style.removeProperty("view-transition-name");
    originalCaption?.style.removeProperty("view-transition-name");

    if (image) {
      image.style.viewTransitionName = TRANSITION;
    }
    if (caption) {
      caption.style.viewTransitionName = CAPTION_TRANSITION;
    }

    document.body.appendChild(lightbox!);
    lightbox?.showModal();

    visibleItem?.scrollIntoView({
      behavior: "instant",
      block: "center",
    });
  });
  void transition.finished.finally(() => {
    image?.style.removeProperty("view-transition-name");
    caption?.style.removeProperty("view-transition-name");
    rootStyle.removeProperty("--view-transition-object-position");
    rootStyle.removeProperty("--view-transition-new-object-fit");
    rootStyle.removeProperty("--view-transition-old-object-fit");
  });
}

function createItem(element: Element) {
  const content = element.cloneNode(true) as HTMLElement;
  content.classList.remove("editable");

  // Clear data attributes
  for (const attribute in content.dataset) {
    delete content.dataset[attribute];
  }
  content.removeAttribute("style");

  content.dataset.related = element.id;
  content.removeAttribute("id");

  const item = document.createElement("li");
  item.addEventListener("click", itemClick);
  item.appendChild(content);
  return item;
}

function itemClick(event: MouseEvent) {
  const element = event.currentTarget as Element;
  const index = Array.prototype.indexOf.call(element.parentElement?.children, element);

  // Scroll item into view
  if (index !== currentIndex) {
    event.stopPropagation();
    element.scrollIntoView({
      behavior: smoothScrollBehavior(),
      block: "center",
    });
  }
}

function keyDown(event: KeyboardEvent) {
  const items = lightbox?.firstElementChild?.children;
  if (items && ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(event.key)) {
    event.preventDefault();
    event.stopPropagation();

    if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
      currentIndex = Math.max(0, currentIndex - 1);
    } else if (event.key === "ArrowDown" || event.key === "ArrowRight" || event.key === " ") {
      currentIndex = Math.min(items.length - 1, currentIndex + 1);
    }

    items[currentIndex]?.scrollIntoView({
      behavior: smoothScrollBehavior(),
      block: "center",
    });
  }
}

function pointerDown(event: PointerEvent) {
  if (
    event.defaultPrevented ||
    !(event.target instanceof HTMLElement) ||
    document.body.dataset.editing
  ) {
    return;
  }
  const element = event.target.closest<HTMLElement>("[data-show-in-lightbox]");
  if (element) {
    event.preventDefault();
    openLightbox(element);
  }
}

export function initialize() {
  document.body.addEventListener("pointerdown", pointerDown);
}
