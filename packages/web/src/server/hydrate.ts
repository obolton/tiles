import { hydrate } from "@/jsx/dom";

const pageData = document.getElementById("page-data")?.textContent;

if (!pageData) {
  throw new Error("Hydration error: page data not found");
}

const { module, data } = JSON.parse(pageData) as {
  module: string;
  data: unknown;
};

const route = await import(/* @vite-ignore */ module);
const Component = route.default.component;

hydrate(Component(data), document.body);
