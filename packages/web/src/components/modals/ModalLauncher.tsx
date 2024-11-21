import { Suspense, useCallback, useEffect, useState } from "react";
import Modal from "./Modal";
import useModal from "@/hooks/useModal";
import { getModal } from "@/utils/modals";

export default function ModalLauncher() {
  const modal = useModal();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(!!modal), [modal]);

  const close = useCallback(
    (result?: unknown) => {
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
    <Modal open={open} onClose={close} originRect={modal?.options?.origin}>
      <Suspense>
        <ModalComponent close={close} {...modal.options} />
      </Suspense>
    </Modal>
  );
}
