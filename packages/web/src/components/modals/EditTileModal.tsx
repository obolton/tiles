import {
  lazy,
  Suspense,
  useCallback,
  useRef,
  useEffect,
  useState,
  type LazyExoticComponent,
  type ComponentType,
} from "react";
import useSearchParam from "../../hooks/useSearchParam";
import { setSearchParam } from "../../utils/navigation";
import styles from "./EditTileModal.module.css";

interface ModalProps {
  pageId: string;
  close: () => void;
}

const MODALS: Record<string, LazyExoticComponent<ComponentType<ModalProps>>> = {
  image: lazy(() => import("./EditImageTileModal")),
};

interface Props {
  pageId: string;
}

export default function EditTileModal({ pageId }: Props) {
  const modal = useSearchParam("modal");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({});
  const [open, setOpen] = useState(false);

  useEffect(() => {}, []);

  useEffect(() => {
    if (modal) {
      const sourceElement = document.getElementById("tileTypeSelector");
      const sourceRect = sourceElement?.getBoundingClientRect();
      if (sourceRect) {
        setStyle({
          "--source-height": `${sourceRect.height}`,
          "--source-x-center": `${sourceRect.x + sourceRect.width / 2}px`,
          "--source-y-center": `${sourceRect.y + sourceRect.height / 2}px`,
        } as React.CSSProperties);
      }
      setOpen(true);
    } else {
      setOpen(false);
    }
  }, [modal]);

  useEffect(() => {
    if (open) {
      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
    }
  }, [open]);

  const close = useCallback(() => setSearchParam("modal", null), []);

  const ModalComponent = modal ? MODALS[modal] : null;

  if (modal && !ModalComponent) {
    console.error(`Invalid modal type: ${modal}`);
    return null;
  }

  return (
    <dialog
      // @ts-expect-error React does not currently support the popover attribute
      // https://github.com/facebook/react/pull/27981
      popover="auto"
      ref={dialogRef}
      style={style}
      className={open ? styles.open : styles.closed}
    >
      {ModalComponent && (
        <Suspense>
          <ModalComponent pageId={pageId} close={close} />
        </Suspense>
      )}
    </dialog>
  );
}
