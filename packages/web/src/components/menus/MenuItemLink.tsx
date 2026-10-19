import type { JSX } from "jsx/jsx";

export interface MenuItemLinkProps extends JSX.Attributes<"a"> {
  label?: string;
  icon?: JSX.Node;
  destructive?: boolean;
}

export default function MenuItemLink({
  label,
  icon,
  destructive,
  children,
  classList,
  ...props
}: MenuItemLinkProps) {
  return (
    <a
      classList={{ menuitem: true, destructive, ...classList }}
      role="menuitem"
      aria-label={label}
      data-tooltip={label}
      {...props}
    >
      {icon}
      {children}
    </a>
  );
}
