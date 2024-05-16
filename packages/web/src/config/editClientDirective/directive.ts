import type { ClientDirective } from "astro";
import { EDIT_START_EVENT } from "../../constants/edit";

const directive: ClientDirective = (load, options, element) => {
  document.addEventListener(
    EDIT_START_EVENT,
    async (event) => {
      const hydrate = await load();
      await hydrate();

      console.debug(`Hydrated ${options.name}`);
      performance.measure("hydrate", {
        start: event.timeStamp,
        detail: {
          component: options.name,
        },
      });
    },
    { once: true }
  );
};

export default directive;
