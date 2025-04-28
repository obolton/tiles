declare module "*.svg?jsx" {
  import type { JSX } from "@/jsx/jsx";
  const Component: JSX.Component<Partial<SVGElementTagNameMap["svg"]>>;
  export default Component;
}
