declare module "*.svg?jsx" {
  import type { FunctionComponent, SVGAttributes } from "react";
  const Component: FunctionComponent<
    SVGAttributes<SVGElement> & { slot?: string | null }
  >;
  export default Component;
}
