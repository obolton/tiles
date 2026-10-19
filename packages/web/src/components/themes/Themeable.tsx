import { render } from "jsx/dom";
import type { JSX } from "jsx/jsx";
import type { Reactive } from "reactivity";
import type { ThemeRegistry } from "@/types/themes";
import type ThemeSelector from "@/elements/themes/ThemeSelector";

export interface ThemeableProps<T> extends JSX.Attributes<"theme-selector"> {
  theme: Reactive<string>;
  options: string[];
  registry: ThemeRegistry<T>;
  getProps: () => T;
  onChange: (theme: string) => void;
  inline?: boolean;
  children?: JSX.Node;
}

export default function Themeable<T>({
  theme,
  options,
  registry,
  getProps,
  onChange,
  inline,
  children,
  ...props
}: ThemeableProps<T>) {
  function getItem(index: number, contents: Node) {
    const key = options[index];
    const Component = key ? registry[key] : null;
    if (!Component) {
      throw new Error(`Invalid theme index: ${index}`);
    }
    return render(<Component {...getProps()}>{contents}</Component>)[0] as HTMLElement;
  }

  function onThemeChange(event: Event) {
    const target = event.currentTarget as ThemeSelector;
    const index = target.value;
    const key = options[index];
    if (!key) {
      throw new Error(`Invalid theme index: ${index}`);
    }
    if (key !== theme.value) {
      onChange(key);
    }
  }

  return (
    <theme-selector
      {...props}
      className={inline ? "inline" : undefined}
      value={theme.derive((current) => Math.max(options.indexOf(current), 0).toString())}
      on:change={onThemeChange}
      max={(options.length - 1).toString()}
      $getItem={getItem}
    >
      {children}
    </theme-selector>
  );
}
