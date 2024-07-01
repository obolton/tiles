export function destroy(element: HTMLElement) {
  return new Promise((resolve, reject) => {
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
      {
        duration: 500,
        easing: "ease",
        fill: "forwards",
      },
    );
    animation.addEventListener("finish", resolve, { once: true });
    animation.addEventListener("cancel", reject, { once: true });
  });
}
