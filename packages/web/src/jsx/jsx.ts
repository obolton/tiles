import type { Reactive } from "@/utils/reactivity";
import type { AttributesFor, ElementTypeFor } from "./html-attributes";

export type WithProperties<T> = {
  [K in keyof T as `$${Extract<K, string>}`]?: T[K] | Reactive<T[K]>;
};

export type WithReactiveProperties<T> = {
  [K in keyof T]?: T[K] | Reactive<T[K]>;
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
        : T extends ClassComponent<infer R>
          ? R
          : never;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export type ElementType =
    | keyof IntrinsicElements
    | Component<any>
    | ClassComponent<any>;

  export type Node =
    | Element
    | string
    | number
    | bigint
    | boolean
    | null
    | undefined
    | Node[]
    | Reactive<Node>
    | globalThis.Node;

  export type Component<P> = (props: P) => Node;

  export type ClassComponent<P> = new (props: P) => ElementClass;

  export interface ElementClass {
    hydrate?(container: globalThis.Element, index: number): globalThis.Node[];
    render(): JSX.Node;
  }

  export interface ElementChildrenAttribute {
    children?: Node;
  }

  export type Ref<T> = (element: T) => void;

  export type DataAttribute = `data-${string}`;

  export type EventHandlers = {
    [K in keyof HTMLElementEventMap as `on:${K}`]?: (
      event: HTMLElementEventMap[K],
    ) => void;
  };

  export type Attributes<TagName extends string> = WithReactiveProperties<
    AttributesFor<TagName>
  > &
    WithProperties<ElementTypeFor<TagName>> & {
      ref?: Ref<ElementTypeFor<TagName>>;
      children?: Node;
      [k: DataAttribute]: string | number | null | undefined;
    } & EventHandlers;

  export type HTMLElements = {
    [T in keyof HTMLElementTagNameMap]: Attributes<T>;
  };

  export type SVGElements = {
    [T in keyof Omit<
      SVGElementTagNameMap,
      "a" | "script" | "style" | "title"
    >]: Attributes<T>;
  };

  export type MathMLElements = {
    [T in keyof MathMLElementTagNameMap]: Attributes<T>;
  };

  export interface IntrinsicElements
    extends HTMLElements, SVGElements, MathMLElements {}
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

export function isClassComponent<T>(
  node: JSX.ElementType,
): node is JSX.ClassComponent<T> {
  return typeof node === "function" && node.prototype && node.prototype.render;
}
