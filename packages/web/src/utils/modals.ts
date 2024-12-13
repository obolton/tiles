import type { LazyExoticComponent, ComponentType } from "react";

export interface ModalOptions {
  origin?: DOMRect;
  [k: string]: unknown;
}

export interface ModalProps<T = unknown> extends ModalOptions {
  close: (result?: T) => void;
}

export class ModalEvent<T extends object> extends Event {
  constructor(
    type: "modal:show" | "modal:remove",
    public readonly modal?: string,
    public readonly callback?: (result: T | undefined) => void,
    public readonly options?: ModalOptions,
  ) {
    super(type);
  }
}

const registry = new Map<
  string,
  LazyExoticComponent<ComponentType<ModalProps<unknown>>>
>();

export function registerModal(
  name: string,
  component: LazyExoticComponent<ComponentType<ModalProps<unknown>>>,
) {
  registry.set(name, component);
}

export function getModal(name: string) {
  const component = registry.get(name);

  if (!component) {
    throw new Error(`Unknown modal: ${name}`);
  }

  return component;
}

export async function showModal<T extends object>(
  modal: string,
  options?: ModalOptions,
) {
  return new Promise<T | undefined>((resolve, reject) => {
    if (!registry.has(modal)) {
      return reject(new Error(`Unknown modal: ${modal}`));
    }
    const event = new ModalEvent<T>("modal:show", modal, resolve, options);
    window.dispatchEvent(event);
  });
}
