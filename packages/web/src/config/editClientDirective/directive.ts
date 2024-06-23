import type { ClientDirective } from "astro";
import { EDIT_START_EVENT } from "../../constants/edit";

const directive: ClientDirective = (load, options) => {
  let hydrated = false;

  function hydrateComponent(startTime: number) {
    hydrated = true;
    load()
      .then((hydrate) => hydrate())
      .then(() => {
        console.debug(`Hydrated ${options.name}`);
        performance.measure("hydrate", {
          start: startTime,
          detail: {
            component: options.name,
          },
        });
      })
      .catch(console.error);
  }

  if (sessionStorage.getItem("edit")) {
    if ("requestIdleCallback" in window) {
      requestIdleCallback(() => hydrateComponent(performance.now()));
    } else {
      // Safari
      setTimeout(() => hydrateComponent(performance.now()), 100);
    }
  }

  document.addEventListener(
    EDIT_START_EVENT,
    (event) => {
      if (!hydrated) {
        hydrateComponent(event.timeStamp);
      }
    },
    { once: true },
  );
};

export default directive;
