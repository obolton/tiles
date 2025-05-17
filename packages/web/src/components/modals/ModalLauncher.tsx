import Modal from "./Modal";
import { getModal } from "@/utils/modals";
import { ReactiveValue } from "@/utils/reactivity";
import type { JSX } from "@/jsx/jsx";

export default function ModalLauncher() {
  const modalElement = new ReactiveValue<JSX.Element | null>(null);
  const isOpen = new ReactiveValue(false);

  function cancel() {
    isOpen.value = false;
  }

  if (!import.meta.env.SSR) {
    addEventListener("showmodal", ({ modal, options }) => {
      if (!modal) {
        return;
      }
      const loader = getModal(modal);
      loader().then(({ default: Component }) => {
        modalElement.value = (
          <Component
            cancel={cancel}
            confirm={async (result: unknown) => {
              await options?.onConfirm?.(result);
              isOpen.value = false;
            }}
            {...options}
          />
        );
        isOpen.value = true;
      });
    });
    addEventListener("hidemodal", () => (modalElement.value = null));
  }

  return (
    <Modal open={isOpen} onClose={cancel}>
      {modalElement}
    </Modal>
  );
}
