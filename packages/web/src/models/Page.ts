import client from "@/api/client";
import Dropdown from "@/models/Dropdown";
import { reactive, array } from "@/utils/reactivity";
import type { AppRouterOutputs } from "@/api/client";
import type { Reactive, ReactiveArray } from "@/utils/reactivity";
import type { Color } from "@/utils/color";
import type { FontId } from "@/config/fonts";
import type { User } from "@/types/collaboration";
import type { DockEdge } from "api/types/tiles";

export type PageData = NonNullable<AppRouterOutputs["pages"]["getById"]>;

export default class Page {
  readonly id: string;
  readonly workspaceId: string;
  readonly author: User;
  readonly title: Reactive<string>;
  readonly backgroundColor: Reactive<Color | null>;
  readonly font: Reactive<FontId | null>;
  readonly coverImageUrl: Reactive<string | null>;
  readonly isPublished: Reactive<boolean>;
  readonly folderId: Reactive<string | null>;
  readonly themeId: Reactive<string | null>;
  readonly dockSizes: Reactive<Record<DockEdge, number | null>>;
  readonly dropdowns: ReactiveArray<Dropdown>;

  constructor(data: PageData) {
    this.id = data.id;
    this.workspaceId = data.workspaceId;
    this.author = data.author;
    this.title = reactive(data.title);
    this.backgroundColor = reactive(data.backgroundColor);
    this.font = reactive(data.font);
    this.coverImageUrl = reactive(data.coverImageUrl);
    this.isPublished = reactive(data.published);
    this.folderId = reactive(data.folderId);
    this.themeId = reactive(data.theme?.id ?? null);
    this.dockSizes = reactive({
      TOP: data.dockTopHeight,
      BOTTOM: data.dockBottomHeight,
      LEFT: data.dockLeftWidth,
      RIGHT: data.dockRightWidth,
    });
    this.dropdowns = array(data.dropdowns.map((d) => new Dropdown(this, d)));
  }

  getDropdown(id: string): Dropdown {
    const dropdown = this.dropdowns.value.find((d) => d.id === id);
    if (!dropdown) {
      throw new Error(`Dropdown cannot be found: ${id}`);
    }
    return dropdown;
  }

  private update(
    properties: Partial<{
      title: string;
      coverImageKey: string | null;
      font: FontId;
      backgroundColor: Color;
      published: boolean;
      folderId: string | null;
      themeId: string | null;
      dockTopHeight: number | null;
      dockBottomHeight: number | null;
      dockLeftWidth: number | null;
      dockRightWidth: number | null;
    }>,
  ) {
    return client.pages.update.mutate({
      pageId: this.id,
      ...properties,
    });
  }

  setTitle(title: string) {
    this.title.value = title;
    document.title = `${title} - Tiles`;
    return this.update({ title });
  }

  setCoverImage(imageKey: string | null) {
    return this.update({ coverImageKey: imageKey });
  }

  setFont(font: FontId) {
    return this.update({ font });
  }

  setBackgroundColor(backgroundColor: Color) {
    return this.update({ backgroundColor });
  }

  setPublished(published: boolean) {
    this.isPublished.value = published;
    return this.update({ published });
  }

  setFolder(folderId: string | null) {
    this.folderId.value = folderId;
    return this.update({ folderId });
  }

  setTheme(themeId: string | null) {
    this.themeId.value = themeId;
    return this.update({ themeId });
  }

  setDockSizes(sizes: Partial<Record<DockEdge, number | null>>) {
    this.dockSizes.value = { ...this.dockSizes.value, ...sizes };
    return this.update({
      dockTopHeight: sizes.TOP,
      dockBottomHeight: sizes.BOTTOM,
      dockLeftWidth: sizes.LEFT,
      dockRightWidth: sizes.RIGHT,
    });
  }

  delete() {
    return client.pages.delete.mutate({ pageId: this.id });
  }
}
