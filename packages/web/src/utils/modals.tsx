import Modal from "@/components/modals/Modal";
import { render } from "jsx/dom";
import type { JSX } from "jsx/jsx";

export type ModalOptions<T, P> = {
  onConfirm?: (result: T) => Promise<void> | void;
  props: P;
};

export interface ModalProps<T = never> {
  confirm: (result: T) => Promise<void> | void;
  cancel: () => void;
}

export type ModalComponent<P extends ModalProps> = JSX.Component<P>;

export type ModalLoader<P extends ModalProps> = () => Promise<{
  default: ModalComponent<P>;
}>;

export async function showModal<T, P>(
  loader: ModalLoader<ModalProps<T> & P>,
  options: ModalOptions<T, P>,
) {
  const { onConfirm, props } = options;
  let dialog: HTMLDialogElement | null = null;

  function cancel() {
    dialog?.requestClose();
  }

  async function confirm(result: T) {
    await onConfirm?.(result);
    dialog?.close();
  }

  const { default: Component } = await loader();

  dialog = render(
    <Modal>
      <Component cancel={cancel} confirm={confirm} {...props} />
    </Modal>,
  )[0] as HTMLDialogElement;

  dialog.addEventListener(
    "close",
    () => {
      Promise.all(dialog!.getAnimations().map((animation) => animation.finished))
        .catch(() => {})
        .finally(() => {
          dialog?.remove();
          dialog = null;
        });
    },
    { once: true },
  );

  document.body.appendChild(dialog);
  dialog.showModal();
}
