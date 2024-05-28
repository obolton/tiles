import {
  lazy,
  Suspense,
  useCallback,
  useRef,
  useEffect,
  useMemo,
  useState,
  type LazyExoticComponent,
  type ComponentType,
} from "react";
import useSearchParam from "../../hooks/useSearchParam";
import { setSearchParams } from "../../utils/navigation";
import type { TileType } from "../../types/tiles";
import styles from "./EditTileModal.module.css";

interface ModalProps {
  pageId: string;
  close: () => void;
}

const MODALS = {
  IMAGE: lazy(() => import("./EditImageTileModal")),
  TEXT: lazy(() => import("./EditTextTileModal")),
} satisfies Record<TileType, LazyExoticComponent<ComponentType<ModalProps>>>;

interface Props {
  pageId: string;
}

export default function EditTileModal({ pageId }: Props) {
  const modal = useSearchParam("modal");
  const tileId = useSearchParam("tileId");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({});
  const [open, setOpen] = useState(false);

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

  const close = useCallback(
    () => setSearchParams({ modal: null, tileId: null }),
    []
  );

  const ModalComponent = modal ? MODALS[modal.toUpperCase() as TileType] : null;

  if (modal && !ModalComponent) {
    console.error(`Invalid modal type: ${modal}`);
    return null;
  }

  const tileData = useMemo(() => {
    if (!tileId) {
      return null;
    }
    const element = document.querySelector(
      `[data-tile-id="${tileId}"]`
    ) as HTMLElement;
    if (!element) {
      throw new Error("Tile not found");
    }
    const data = element.dataset.tile;
    if (!data) {
      throw new Error("Tile data not found");
    }
    return JSON.parse(data);
  }, [tileId]);

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
          <ModalComponent pageId={pageId} close={close} tile={tileData} />
        </Suspense>
      )}
    </dialog>
  );
}
