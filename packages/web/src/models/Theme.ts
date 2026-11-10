import { reactive, type Reactive } from "carillon";
import client from "@/api/client";
import type { AppRouterInputs } from "@/api/client";
import type { Theme as ThemeData } from "api/routes/themes/fields";

export type { ThemeData };

export type ThemeBackground = ThemeData["background"];
export type ThemeColors = ThemeData["colors"];
export type ThemeFonts = ThemeData["fonts"];

/** The editable values of a theme. */
export type ThemeValues = Pick<ThemeData, "name" | "background" | "colors" | "fonts">;

/** A partial change to a theme; colours and fonts may themselves be partial. */
export type ThemePatch = Omit<AppRouterInputs["themes"]["update"], "id" | "workspaceId">;

export default class Theme {
  readonly id: string;
  readonly workspaceId: string;
  readonly data: Reactive<ThemeData>;

  constructor(data: ThemeData) {
    this.id = data.id;
    this.workspaceId = data.workspaceId;
    this.data = reactive(data);
  }

  /** Applies the change locally, persists it, and reverts it if persisting fails. */
  async update(patch: ThemePatch) {
    const previous = this.data.value;
    this.data.value = {
      ...previous,
      ...patch,
      colors: { ...previous.colors, ...patch.colors },
      fonts: { ...previous.fonts, ...patch.fonts },
    };

    try {
      await client.themes.update.mutate({ ...patch, workspaceId: this.workspaceId, id: this.id });
    } catch (error) {
      this.data.value = previous;
      throw error;
    }
  }

  serialize(): ThemeData {
    return this.data.value;
  }

  duplicate() {
    const { name, background, colors, fonts } = this.data.value;
    return client.themes.create.mutate({
      workspaceId: this.workspaceId,
      name: `${name} Copy`,
      background,
      colors,
      fonts,
    });
  }

  delete() {
    return client.themes.delete.mutate({
      workspaceId: this.workspaceId,
      id: this.id,
    });
  }
}
