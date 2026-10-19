import type { JSX } from "jsx/jsx";

export type ThemeRegistry<Props> = Record<string, JSX.Component<Props>>;
