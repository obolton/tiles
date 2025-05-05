import type { JSX } from "@/jsx/jsx";

export interface BodyProps extends JSX.Attributes<HTMLBodyElement> {
  children: JSX.Node;
  hydrate?: {
    module: string;
    data: unknown;
  };
}

export default function Body({ children, hydrate, ...props }: BodyProps) {
  return (
    <body {...props}>
      {children}
      {hydrate ? (
        <script id="page-data" type="application/json">
          {JSON.stringify(hydrate)}
        </script>
      ) : null}
    </body>
  );
}
