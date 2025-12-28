import type { JSX } from "@/jsx/jsx";

export interface MenuProps extends JSX.Attributes<"div"> {}

export default function Menu({ children, classList, ...props }: MenuProps) {
  return (
    <div role="menu" classList={{ menu: true, ...classList }} {...props}>
      {children}
    </div>
  );
}
