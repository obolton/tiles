export async function startPresentation(startSlide = 0) {
  const main = document.querySelector("main");

  if (!(main instanceof HTMLElement)) {
    throw new Error("No main element found");
  }

  const { default: Presentation } = await import("./Presentation");
  Presentation.start(main, startSlide);
}
