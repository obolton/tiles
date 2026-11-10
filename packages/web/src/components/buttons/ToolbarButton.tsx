import type { Reactive } from "carillon";
import type { JSX } from "jsx/jsx";

export interface ToolbarButtonProps extends JSX.Attributes<"button"> {
  label?: string | Reactive<string>;
  destructive?: boolean;
}

export default function ToolbarButton({
  label,
  destructive,
  children,
  classList,
  ...props
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      classList={{ floating: true, destructive, ...classList }}
      aria-label={label}
      data-tooltip={label}
      {...props}
    >
      {children}
    </button>
  );
}
