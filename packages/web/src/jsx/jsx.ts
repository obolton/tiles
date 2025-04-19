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
    | Node[];

  export type Component<P> = (props: P) => Node;

  export interface ElementChildrenAttribute {
    children?: Node;
  }

  export type HTMLAttributes<T extends keyof HTMLElementTagNameMap> = Partial<
    Omit<HTMLElementTagNameMap[T], "children" | "style">
  > & { children?: Node; style?: Partial<CSSStyleDeclaration> };

  export type HTMLElements = {
    [T in keyof HTMLElementTagNameMap]: HTMLAttributes<T>;
  };

  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  export interface IntrinsicElements extends HTMLElements {}
}

export function jsx<T extends JSX.ElementType>(
  type: T,
  properties: JSX.Properties<T>,
  key?: string,
): JSX.Element<T> {
  return { type, properties, key };
}
