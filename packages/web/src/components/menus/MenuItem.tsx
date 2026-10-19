import type { JSX } from "@/jsx/jsx";
import type { Reactive } from "reactivity";

export interface MenuItemProps extends JSX.Attributes<"button"> {
  label?: string;
  icon?: JSX.Node;
  destructive?: boolean;
  checked?: boolean | Reactive<boolean>;
  role?: "menuitem" | "menuitemcheckbox" | "menuitemradio";
}

export default function MenuItem({
  label,
  icon,
  destructive,
  checked,
  role,
  children,
  classList,
  ...props
}: MenuItemProps) {
  const resolvedRole = role ?? (checked !== undefined ? "menuitemcheckbox" : "menuitem");
  return (
    <button
      type="button"
      classList={{ menuitem: true, destructive, ...classList }}
      role={resolvedRole}
      aria-checked={checked}
      aria-label={label}
      data-tooltip={label}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
