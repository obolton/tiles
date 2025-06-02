import { render } from "@/jsx/dom";
import type { JSX } from "@/jsx/jsx";
import type { Reactive } from "@/utils/reactivity";
import type ThemeSelector from "@/elements/themes/ThemeSelector";
import type { ThemeRegistry } from "@/types/themes";

export interface ThemeableProps<T> extends JSX.Attributes<ThemeSelector> {
  theme: Reactive<string>;
  options: string[];
  registry: ThemeRegistry<T>;
  getProps: () => T;
  onChange: (theme: string) => void;
  children?: JSX.Node;
}

export default function Themeable<T>({
  theme,
  options,
  registry,
  getProps,
  onChange,
  children,
  ...props
}: ThemeableProps<T>) {
  function getItem(index: number) {
    const key = options[index];
    const Component = key ? registry[key] : null;
    if (!Component) {
      return null;
    }
    return render(<Component {...getProps()} />) as HTMLElement;
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

  const value = Math.max(options.indexOf(theme.value), 0);

  return (
    <theme-selector
      {...props}
      value={value}
      onchange={onThemeChange}
      max={options.length.toString()}
      $getItem={getItem}
    >
      {children}
    </theme-selector>
  );
}
