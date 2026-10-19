declare module "*.svg?jsx" {
  import type { JSX } from "jsx/jsx";
  const Component: JSX.Component<JSX.Attributes<"svg">>;
  export default Component;
}
