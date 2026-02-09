import { safeJsonStringify } from "@/utils/serialize";
import type { JSX } from "@/jsx/jsx";
import type { RouteParameters } from "@/router/router";

export interface RouteContext {
  module: string;
  params: RouteParameters;
}

export interface BodyProps extends JSX.Attributes<"body"> {
  children: JSX.Node;
  routeContext?: RouteContext;
}

export default function Body({ children, routeContext, ...props }: BodyProps) {
  return (
    <body {...props}>
      {children}
      {routeContext ? (
        <script id="route-context" type="application/json">
          {safeJsonStringify(routeContext)}
        </script>
      ) : null}
    </body>
  );
}
