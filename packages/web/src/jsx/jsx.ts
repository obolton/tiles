import type { Reactive } from "@/utils/reactivity";

export type WithReactiveProperties<T> = {
  [K in keyof T]: T[K] | Reactive<T[K]>;
};

export namespace JSX {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export type Element<T extends ElementType = any> = {
    type: T;
    properties: Properties<T>;
    key?: string | null;
  };

  export type Properties<T extends ElementType> =
    T extends keyof IntrinsicElements
      ? IntrinsicElements[T]
      : T extends Component<infer R>
        ? R
        : never;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export type ElementType = keyof IntrinsicElements | Component<any>;

  export type Node =
    | Element
    | string
    | number
    | bigint
    | boolean
    | null
    | undefined
    | Node[]
    | Reactive<Node>;

  export type Component<P> = (props: P) => Node;

  export interface ElementChildrenAttribute {
    children?: Node;
  }

  export type Ref<T> = (element: T) => void;

  export type CustomCSSProperty = `--${string}`;

  export type StyleDeclaration = Partial<CSSStyleDeclaration> &
    Record<CustomCSSProperty, string | undefined>;

  export type DataAttribute = `data-${string}`;

  export type Attributes<T extends globalThis.Element> = WithReactiveProperties<
    Partial<Omit<T, "children" | "classList" | "style">> & {
      style?: StyleDeclaration;
    }
  > & {
    ref?: Ref<T>;
    classList?:
      | (string | null | undefined | Reactive<string | null | undefined>)[]
      | { [k: string]: boolean | Reactive<boolean> };
    children?: Node;
    [k: DataAttribute]: string | null | undefined;
  };

  export type HTMLElements = {
    [T in keyof HTMLElementTagNameMap]: Attributes<HTMLElementTagNameMap[T]>;
  };

  export type SVGElements = {
    [T in keyof Omit<
      SVGElementTagNameMap,
      "a" | "script" | "style" | "title"
    >]: Attributes<SVGElementTagNameMap[T]>;
  };

  export type MathMLElements = {
    [T in keyof MathMLElementTagNameMap]: Attributes<
      MathMLElementTagNameMap[T]
    >;
  };

  export interface IntrinsicElements
    extends HTMLElements,
      SVGElements,
      MathMLElements {}
}

export function jsx<T extends JSX.ElementType>(
  type: T,
  properties: JSX.Properties<T>,
  key?: string,
): JSX.Element<T> {
  return { type, properties, key };
}

interface FragmentProperties {
  children?: JSX.Node;
}

export function Fragment({ children }: FragmentProperties) {
  return children;
}
