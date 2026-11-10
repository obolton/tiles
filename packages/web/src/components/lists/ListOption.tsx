import type { Reactive } from "carillon";
import type { JSX } from "jsx/jsx";

export interface ListOptionProps extends JSX.Attributes<"div"> {
  value?: string;
  label?: string | Reactive<string>;
  icon?: JSX.Node;
}

export default function ListOption({
  value,
  label,
  icon,
  children,
  classList,
  ...props
}: ListOptionProps) {
  return (
    <div
      role="option"
      classList={{ option: true, ...classList }}
      aria-label={label}
      data-value={value}
      data-label={label}
      {...props}
    >
      {icon}
      {children}
    </div>
  );
}
