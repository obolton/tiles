import type { JSX } from "@/jsx/jsx";

export interface ModalOptions<T> {
  onConfirm?: (result: T) => Promise<void>;
  [k: string]: unknown;
}

export interface ModalProps<T = unknown> extends ModalOptions<T> {
  confirm: (result: T) => Promise<void>;
  cancel: () => void;
}

export class ModalEvent<T extends object> extends Event {
  constructor(
    type: "showmodal" | "hidemodal",
    public readonly modal?: string,
    public readonly options?: ModalOptions<T>,
  ) {
    super(type, { bubbles: true });
  }
}

export type ModalComponent<T = unknown> = JSX.Component<ModalProps<T>>;

export type ModalLoader<T = unknown> = () => Promise<{
  default: ModalComponent<T>;
}>;

const registry = new Map<string, ModalLoader>();

export function registerModal(name: string, component: ModalLoader) {
  registry.set(name, component);
}

export function getModal(name: string) {
  const component = registry.get(name);

  if (!component) {
    throw new Error(`Unknown modal: ${name}`);
  }

  return component;
}

export function showModal<T extends object>(
  modal: string,
  options?: ModalOptions<T>,
) {
  if (!registry.has(modal)) {
    throw new Error(`Unknown modal: ${modal}`);
  }
  const event = new ModalEvent<T>("showmodal", modal, options);
  window.dispatchEvent(event);
}
