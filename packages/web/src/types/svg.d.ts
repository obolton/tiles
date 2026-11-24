declare module "*.svg?jsx" {
  import type { JSX } from "brushstroke";
  const Component: JSX.Component<JSX.Attributes<"svg">>;
  export default Component;
}
