export namespace JSX {
  export type Element<P extends object = object> = {
    type: string;
    properties: P;
    children?: JSX.Node;
    key?: string | null;
  };

  export type ElementType = keyof IntrinsicElements;

  export type Node =
    | JSX.Element
    | string
    | number
    | bigint
    | boolean
    | null
    | undefined
    | JSX.Node[];

  export type HTMLAttributes<T extends keyof HTMLElementTagNameMap> = Partial<
    Omit<HTMLElementTagNameMap[T], "children">
  > & {
    children?: JSX.Node;
  };

  export type IntrinsicElements = {
    [T in keyof HTMLElementTagNameMap]: HTMLAttributes<T>;
  };
}

export function jsx<T extends JSX.ElementType>(
  type: T,
  { children, ...properties }: JSX.HTMLAttributes<T> = {},
  key?: string,
): JSX.Element {
  return { type, properties, children, key };
}
