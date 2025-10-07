import type { JSX } from "@/jsx/jsx";

export interface ToolbarButtonProps
  extends Omit<JSX.Attributes<HTMLButtonElement>, "className"> {
  label: string;
  destructive?: boolean;
}

export default function ToolbarButton({
  label,
  destructive,
  children,
  ...props
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      role="menuitem"
      classList={{ floating: true, destructive }}
      aria-label={label}
      data-tooltip={label}
      {...props}
    >
      {children}
    </button>
  );
}
