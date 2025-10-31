import type { JSX } from "@/jsx/jsx";

export interface ToolbarButtonProps extends JSX.Attributes<HTMLButtonElement> {
  label?: string;
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
      role="menuitem"
      classList={{ floating: true, destructive, ...classList }}
      aria-label={label}
      data-tooltip={label}
      {...props}
    >
      {children}
    </button>
  );
}
