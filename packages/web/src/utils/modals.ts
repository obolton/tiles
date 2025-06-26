import type { JSX } from "@/jsx/jsx";

export interface ModalOptions<T> {
  onConfirm?: (result: T) => Promise<void> | void;
  [k: string]: unknown;
}

export interface ModalProps<T = never> extends ModalOptions<T> {
  confirm: (result: T) => Promise<void>;
  cancel: () => void;
}

export class ModalEvent<T> extends Event {
  constructor(
    type: "showmodal" | "hidemodal",
    public readonly modal?: string,
    public readonly options?: ModalOptions<T>,
  ) {
    super(type, { bubbles: true });
  }
}

export type ModalComponent<T extends ModalProps> = JSX.Component<T>;

export type ModalLoader<T extends ModalProps> = () => Promise<{
  default: ModalComponent<T>;
}>;

const registry = new Map<string, ModalLoader<never>>();

export function registerModal<T extends ModalProps>(
  name: string,
  loader: ModalLoader<T>,
) {
  registry.set(name, loader);
}

export function getModal(name: string) {
  const component = registry.get(name);

  if (!component) {
    throw new Error(`Unknown modal: ${name}`);
  }

  return component;
}

export function showModal<T>(modal: string, options?: ModalOptions<T>) {
  if (!registry.has(modal)) {
    throw new Error(`Unknown modal: ${modal}`);
  }
  const event = new ModalEvent<T>("showmodal", modal, options);
  window.dispatchEvent(event);
}
