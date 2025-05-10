import "@/elements/global";
import "@/utils/tooltips";

addEventListener(
  "DOMContentLoaded",
  () => {
    delete document.body.dataset.disableTransitions;
  },
  { once: true },
);
