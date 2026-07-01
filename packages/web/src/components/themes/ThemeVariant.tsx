import type { ThemeRegistry } from "@/types/themes";

export type ThemeVariantProps<T> = {
  theme: string;
  registry: ThemeRegistry<T>;
} & T;

export default function ThemeVariant<T>({ theme, registry, ...props }: ThemeVariantProps<T>) {
  const Component = registry[theme];
  if (!Component) {
    return null;
  }
  return <Component {...(props as T)} />;
}
