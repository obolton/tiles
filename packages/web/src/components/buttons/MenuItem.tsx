import type { JSX } from "@/jsx/jsx";
import type { Reactive } from "@/utils/reactivity";

export interface MenuItemProps extends JSX.Attributes<HTMLButtonElement> {
  icon: JSX.Node;
  destructive?: boolean;
  checked?: Reactive<boolean>;
}

export default function MenuItem({
  icon,
  destructive,
  checked,
  children,
  classList,
  ...props
}: MenuItemProps) {
  return (
    <button
      type="button"
      classList={{ destructive, ...classList }}
      role={checked ? "menuitemcheckbox" : "menuitem"}
      aria-checked={checked}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
