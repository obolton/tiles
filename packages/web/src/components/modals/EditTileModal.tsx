import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type LazyExoticComponent,
  type ComponentType,
} from "react";
import Modal from "./Modal";
import useEditTile from "../../hooks/useEditTile";
import { finishEditingTile } from "../../utils/edit";
import type { ClientTile, TileType } from "../../types/tiles";

interface ModalProps {
  pageId: string;
  close: () => void;
}

const MODALS = {
  IMAGE: lazy(() => import("./EditImageTileModal")),
  TEXT: lazy(() => import("./EditTextTileModal")),
  PLACE: lazy(() => import("./EditPlaceTileModal")),
} satisfies Record<TileType, LazyExoticComponent<ComponentType<ModalProps>>>;

interface Props {
  pageId: string;
}

export default function EditTileModal({ pageId }: Props) {
  const { tileId, tileType } = useEditTile();
  const [open, setOpen] = useState(false);
  const [originRect, setOriginRect] = useState<DOMRect | undefined>();

  const tileElement = useMemo(() => {
    if (!tileId) {
      return null;
    }
    return document.querySelector(`[data-tile-id="${tileId}"]`) as HTMLElement;
  }, [tileId]);

  const tileData = useMemo(() => {
    if (!tileId || !tileElement) {
      return null;
    }
    const data = tileElement.dataset.tile;
    if (!data) {
      throw new Error("Tile data not found");
    }
    return JSON.parse(data) as ClientTile;
  }, [tileId, tileElement]);

  useEffect(() => {
    if (tileType) {
      const originElement = tileId
        ? tileElement
        : document.getElementById("tileTypeSelector");
      const rect = originElement?.getBoundingClientRect();
      setOriginRect(rect);
      setOpen(true);
    } else {
      setOpen(false);
    }
  }, [tileId, tileType, tileElement]);

  const close = useCallback(() => setOpen(false), []);

  const ModalComponent = tileType ? MODALS[tileType] : null;

  if (tileType && !ModalComponent) {
    throw new Error(`Unsupported tile type: ${tileType}`);
  }

  if (!ModalComponent) {
    return null;
  }

  return (
    <Modal
      open={open}
      onClose={close}
      onHide={finishEditingTile}
      originRect={originRect}
    >
      <Suspense>
        <ModalComponent
          pageId={pageId}
          close={close}
          // @ts-expect-error TODO: Improve type inference for tileData
          tile={tileData}
        />
      </Suspense>
    </Modal>
  );
}
