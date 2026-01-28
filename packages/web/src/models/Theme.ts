import { reactive, type Reactive } from "@/utils/reactivity";
import client from "@/api/client";
import type { AppRouterOutputs, AppRouterInputs } from "@/api/client";
import type { Color } from "@/utils/color";
import type { FontId } from "@/config/fonts";

export type ThemeData = NonNullable<AppRouterOutputs["themes"]["getById"]>;

export interface ThemeColors {
  background: Color;
  text: Color;
  accent: Color;
}

export interface ThemeFonts {
  heading: FontId;
  body: FontId;
  code: FontId;
}

export interface ThemeBorder {
  color: Color | null;
  radius: number | null;
}

export default class Theme {
  readonly id: string;
  readonly workspaceId: string;
  readonly name: Reactive<string>;
  readonly colors: Reactive<ThemeColors>;
  readonly fonts: Reactive<ThemeFonts>;
  readonly border: Reactive<ThemeBorder>;

  constructor(data: ThemeData) {
    this.id = data.id;
    this.workspaceId = data.workspaceId;
    this.name = reactive(data.name);
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

  setBorder(border: Partial<ThemeBorder>) {
    this.border.value = { ...this.border.value, ...border };
    return this.update({ border });
  }

  delete() {
    return client.themes.delete.mutate({
      workspaceId: this.workspaceId,
      id: this.id,
    });
  }
}
