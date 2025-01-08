import client from "@/api/client";
import type { FontId } from "@/config/fonts";
import type { Theme } from "@/types/pages";
import { showModal } from "@/utils/modals";
import type { ImageModalResult } from "@/components/modals/ImageModal";
import { uploadMedia } from "@/utils/media";
import { isEditModeEnabled, createImage, createLink } from "@/utils/edit";
import { getAcceptableDragItem, isImage, isUriList } from "@/utils/media";
import type { ClientTile } from "@/types/tiles";
import { Store } from "@/utils/stores";
import type { AppRouterInputs, AppRouterOutputs } from "@/api/client";

type Page = NonNullable<AppRouterOutputs["pages"]["getById"]>;

const IS_SERVER = import.meta.env.SSR;

export default class Editor {
  readonly pageId: string;
  readonly tiles: Store<ClientTile[]>;

  constructor(page: Page) {
    this.pageId = page.id;
    this.tiles = new Store(page.tiles);

    if (!IS_SERVER) {
      this.enableDragAndDrop();
    }
  }

  enableDragAndDrop() {
    document.addEventListener("dragover", this.dragOver.bind(this));
    document.addEventListener("drop", this.drop.bind(this));
  }

  private dragOver(event: DragEvent) {
    if (!isEditModeEnabled() || !event.dataTransfer) {
      return;
    }

    const item = getAcceptableDragItem(event.dataTransfer);

    if (item) {
      event.preventDefault();
      event.dataTransfer.dropEffect = "copy";
    }
  }

  private drop(event: DragEvent) {
    if (!isEditModeEnabled() || !event.dataTransfer) {
      return;
    }

    const item = getAcceptableDragItem(event.dataTransfer);
    if (!item) {
      return;
    }

    event.preventDefault();

    if (isImage(item)) {
      showModal<ImageModalResult>("IMAGE", {
        file: item.getAsFile(),
        async onConfirm(result) {
          const imageKey = await uploadMedia(result.image, "image");
          await createImage({ imageKey });
        },
      });
    } else if (isUriList(item)) {
      item.getAsString(async (url) => {
        await createLink({ url });
      });
    }
  }

  async setPageTitle(title?: string, subtitle?: string) {
    return client.pages.update.mutate({
      pageId: this.pageId,
      title,
      subtitle,
    });
  }

  async setCoverImage(imageKey: string | null) {
    return client.pages.update.mutate({
      pageId: this.pageId,
      coverImageKey: imageKey,
    });
  }

  async setFont(font: FontId) {
    return client.pages.update.mutate({ pageId: this.pageId, font });
  }

  async setTheme(theme: Theme, hue?: number | null) {
    return client.pages.update.mutate({ pageId: this.pageId, theme, hue });
  }

  async setPublished(published: boolean) {
    return client.pages.update.mutate({ pageId: this.pageId, published });
  }

  async deletePage() {
    return client.pages.delete.mutate({ pageId: this.pageId });
  }

  async deleteTile(id: string) {
    return client.tiles.delete.mutate({ pageId: this.pageId, id });
  }

  async moveTile(id: string, position: number) {
    return client.tiles.move.mutate({ pageId: this.pageId, id, position });
  }

  async resizeTile(id: string, columns: number, rows: number) {
    return client.tiles.resize.mutate({
      pageId: this.pageId,
      id,
      columns,
      rows,
    });
  }
}
