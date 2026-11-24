import type { JSX } from "brushstroke";

export type ThemeRegistry<Props> = Record<string, JSX.Component<Props>>;
