import type { JSX } from "@/jsx/jsx";
import type { Reactive } from "@/utils/reactivity";

// TODO: Support menuitemradio role for Swatch
export interface MenuItemProps extends JSX.Attributes<"button"> {
  label?: string;
  icon?: JSX.Node;
  destructive?: boolean;
  checked?: Reactive<boolean>;
}

export default function MenuItem({
  label,
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
      aria-label={label}
      data-tooltip={label}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
