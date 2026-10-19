import type { JSX } from "jsx/jsx";

export interface ListGroupProps extends JSX.Attributes<"div"> {
  label?: string;
}

export default function ListGroup({ label, children, ...props }: ListGroupProps) {
  return (
    <div role="group" aria-label={label} {...props}>
      {children}
    </div>
  );
}
