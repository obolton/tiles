import type { JSX } from "@/jsx/jsx";

export interface ToolbarGroupProps extends JSX.Attributes<"div"> {
  label: string;
}

export default function ToolbarGroup({ label, children, ...props }: ToolbarGroupProps) {
  return (
    <div role="group" aria-label={label} {...props}>
      {children}
    </div>
  );
}
