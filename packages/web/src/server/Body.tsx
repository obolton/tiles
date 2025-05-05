import type { JSX } from "@/jsx/jsx";

export interface BodyProps {
  children: JSX.Node;
  hydrate?: {
    module: string;
    data: unknown;
  };
}

export default function Body({ children, hydrate }: BodyProps) {
  return (
    <body>
      {children}
      {hydrate ? (
        <script id="page-data" type="application/json">
          {JSON.stringify(hydrate)}
        </script>
      ) : null}
    </body>
  );
}
