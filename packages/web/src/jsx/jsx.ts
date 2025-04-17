export namespace JSX {
  export type Properties<T = unknown> = T & {
    children?: JSX.Node;
  };

  export type Element<P = unknown> = {
    type: JSX.ElementType;
    properties: Properties<P>;
    key?: string | null;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export type ElementType = keyof IntrinsicElements | JSX.Component<any>;

  export type Node =
    | JSX.Element
    | string
    | number
    | bigint
    | boolean
    | null
    | undefined
    | JSX.Node[];

  export type Component<P> = (props: P) => JSX.Node;

  export interface ElementChildrenAttribute {
    children?: JSX.Node;
  }

  export type HTMLAttributes<T extends keyof HTMLElementTagNameMap> = Partial<
    Omit<HTMLElementTagNameMap[T], "children">
  > & { children?: JSX.Node };

  export type HTMLElements = {
    [T in keyof HTMLElementTagNameMap]: HTMLAttributes<T>;
  };

  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  export interface IntrinsicElements extends HTMLElements {}
}

export function jsx<P extends JSX.Properties>(
  type: JSX.ElementType,
  properties: P,
  key?: string,
): JSX.Element<P> {
  return { type, properties, key };
}
