import type { JSX } from "@/jsx/jsx";

export interface ListOptionProps extends JSX.Attributes<"button"> {
  label?: string;
  icon?: JSX.Node;
}

export default function ListOption({
  label,
  icon,
  children,
  classList,
  ...props
}: ListOptionProps) {
  return (
    <button
      type="button"
      role="option"
      classList={{ option: true, ...classList }}
      aria-label={label}
      data-label={label}
      data-tooltip={label}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
