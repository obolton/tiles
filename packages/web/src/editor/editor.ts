import client from "@/api/client";
import type { FontId } from "@/config/fonts";
import type { Theme } from "@/types/pages";

export default class Editor {
  readonly pageId: string;

  constructor(pageId: string) {
    this.pageId = pageId;
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
