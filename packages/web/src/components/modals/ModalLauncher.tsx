import { Suspense, useCallback, useEffect, useState } from "react";
import Modal from "./Modal";
import useModal from "@/hooks/useModal";
import { getModal } from "@/utils/modals";

export default function ModalLauncher() {
  const modal = useModal();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(!!modal), [modal]);

  const cancel = useCallback(() => {
    setOpen(false);
    modal?.callback?.();
  }, [modal]);

  const confirm = useCallback(
    async (result: unknown) => {
      await modal?.options?.onConfirm?.(result);
      setOpen(false);
      modal?.callback?.(result);
    },
    [modal],
  );

  if (!modal) {
    return null;
  }

  const ModalComponent = getModal(modal.modal);

  return (
    <Modal open={open} onClose={cancel} originRect={modal?.options?.origin}>
      <Suspense>
        <ModalComponent cancel={cancel} confirm={confirm} {...modal.options} />
      </Suspense>
    </Modal>
  );
}
