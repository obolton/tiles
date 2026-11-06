import { reactive } from "reactivity";
import SidebarPanel from "@/components/pages/SidebarPanel";
import { themesCache } from "@/utils/cache";
import { handleError } from "@/utils/errors";
import { loadFonts } from "@/utils/fonts";
import { showModal } from "@/utils/modals";
import { duplicateWorkspaceTheme, deleteWorkspaceTheme } from "@/utils/workspaceThemes";
import type Page from "@/models/Page";
import type Theme from "@/models/Theme";
import type { ThemePatch } from "@/models/Theme";
import type { UnsubscribeCallback } from "reactivity";

export const THEME_EDITOR_PANEL_ID = "theme-editor-panel";
export const THEME_EDITOR_NAME_ID = "theme-editor-name";

/**
 * State for the theme editor sidebar. While a theme is being edited, every change refreshes
 * the page's snapshot of it, so the page previews the edit live wherever it uses the theme.
 */
export default class ThemeEditor extends SidebarPanel {
  readonly theme = reactive<Theme | null>(null);
  private unsubscribe: UnsubscribeCallback | null = null;

  constructor(private readonly page: Page) {
    super(THEME_EDITOR_PANEL_ID);
  }

  edit(theme: Theme, returnFocusId?: string) {
    this.unsubscribe?.();
    this.theme.value = theme;
    this.unsubscribe = theme.data.subscribe(() => this.page.themes.refresh(theme));
    this.open(returnFocusId);
    requestAnimationFrame(() => document.getElementById(THEME_EDITOR_NAME_ID)?.focus());
  }

  close() {
    if (!this.isOpen.value) {
      return;
    }
    this.unsubscribe?.();
    this.unsubscribe = null;
    super.close();
    this.theme.value = null;
  }

  update(patch: ThemePatch) {
    const theme = this.theme.value;
    if (!theme) {
      return;
    }
    if (patch.fonts) {
      const fonts = Object.values(patch.fonts).filter((font) => font !== undefined);
      loadFonts(...fonts).catch(handleError);
    }
    theme
      .update(patch)
      .then(() => themesCache.upsert(theme))
      .catch(handleError);
  }

  async duplicate() {
    const theme = this.theme.value;
    if (!theme) {
      return;
    }
    try {
      this.edit(await duplicateWorkspaceTheme(theme));
    } catch (error) {
      handleError(error);
    }
  }

  delete() {
    const theme = this.theme.value;
    if (!theme) {
      return;
    }
    void showModal(() => import("@/components/modals/themes/DeleteThemeModal"), {
      props: { name: theme.data.value.name },
      onConfirm: async () => {
        await deleteWorkspaceTheme(theme);
        this.close();
      },
    });
  }
}
