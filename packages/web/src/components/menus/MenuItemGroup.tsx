import type { JSX } from "@/jsx/jsx";

export interface MenuItemGroupProps extends JSX.Attributes<"div"> {
  label?: string;
}

export default function MenuItemGroup({ label, children, ...props }: MenuItemGroupProps) {
  return (
    <div role="group" aria-label={label} {...props}>
      {children}
    </div>
  );
}
