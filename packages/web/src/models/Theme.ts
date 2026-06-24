import { reactive, type Reactive } from "@/utils/reactivity";
import client from "@/api/client";
import type { AppRouterInputs } from "@/api/client";
import type { Theme as ThemeData } from "api/routes/themes/fields";
import type { Color } from "@/utils/color";
import type { FontId } from "api/config/fonts";

export type { ThemeData };

export type ThemeBackground = NonNullable<ThemeData["background"]>;

export interface ThemeColors {
  text: Color;
  accent: Color;
}

export interface ThemeFonts {
  heading: FontId;
  body: FontId;
  code: FontId;
}

export default class Theme {
  readonly id: string;
  readonly workspaceId: string;
  readonly name: Reactive<string>;
  readonly background: Reactive<ThemeData["background"]>;
  readonly colors: Reactive<ThemeColors>;
  readonly fonts: Reactive<ThemeFonts>;
  readonly border: Reactive<Color | null>;

  constructor(data: ThemeData) {
    this.id = data.id;
    this.workspaceId = data.workspaceId;
    this.name = reactive(data.name);
    this.background = reactive(data.background);
    this.colors = reactive(data.colors);
    this.fonts = reactive(data.fonts);
    this.border = reactive(data.border);
  }

  private update(
    properties: Omit<AppRouterInputs["themes"]["update"], "id" | "workspaceId">,
  ) {
    return client.themes.update.mutate({
      ...properties,
      workspaceId: this.workspaceId,
      id: this.id,
    });
  }

  setName(name: string) {
    this.name.value = name;
    return this.update({ name });
  }

  setColors(colors: Partial<ThemeColors>) {
    this.colors.value = { ...this.colors.value, ...colors };
    return this.update({ colors });
  }

  setFonts(fonts: Partial<ThemeFonts>) {
    this.fonts.value = { ...this.fonts.value, ...fonts };
    return this.update({ fonts });
  }

  setBackground(background: ThemeBackground) {
    this.background.value = background;
    return this.update({ background });
  }

  setBorder(border: Color | null) {
    this.border.value = border;
    return this.update({ border });
  }

  serialize(): ThemeData {
    return {
      id: this.id,
      workspaceId: this.workspaceId,
      name: this.name.value,
      background: this.background.value,
      colors: this.colors.value,
      fonts: this.fonts.value,
      border: this.border.value,
    };
  }

  duplicate() {
    const { background, ...data } = this.serialize();
    return client.themes.create.mutate({
      ...data,
      name: `${data.name} Copy`,
      background: background ?? undefined,
    });
  }

  delete() {
    return client.themes.delete.mutate({
      workspaceId: this.workspaceId,
      id: this.id,
    });
  }
}
