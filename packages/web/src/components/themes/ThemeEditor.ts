import { reactive } from "carillon";
import SidebarPanel from "@/components/pages/SidebarPanel";
import { themesCache } from "@/utils/cache";
import { handleError } from "@/utils/errors";
import { focusInside } from "@/utils/focus";
import { loadFonts } from "@/utils/fonts";
import { showModal } from "@/utils/modals";
import { duplicateWorkspaceTheme, deleteWorkspaceTheme } from "@/utils/workspaceThemes";
import type Page from "@/models/Page";
import type Theme from "@/models/Theme";
import type { ThemePatch } from "@/models/Theme";
import type { SidebarSlot } from "@/components/pages/SidebarPanel";
import type { UnsubscribeCallback } from "carillon";

export const THEME_EDITOR_PANEL_ID = "theme-editor-panel";

/**
 * State for the theme editor sidebar. While a theme is being edited, every change refreshes
 * the page's snapshot of it, so the page previews the edit live wherever it uses the theme.
 */
export default class ThemeEditor extends SidebarPanel {
  readonly theme = reactive<Theme | null>(null);
  private unsubscribe: UnsubscribeCallback | null = null;

  constructor(
    private readonly page: Page,
    sidebar?: SidebarSlot,
  ) {
    super(THEME_EDITOR_PANEL_ID, null, sidebar);
  }

  edit(theme: Theme) {
    this.unsubscribe?.();
    this.theme.value = theme;
    this.unsubscribe = theme.data.subscribe(() => this.page.themes.refresh(theme));

    if (this.isOpen.value) {
      // The form re-renders for the new theme, so keep focus within the panel
      requestAnimationFrame(() => {
        const panel = document.getElementById(this.panelId);
        if (panel) {
          focusInside(panel);
        }
      });
    } else {
      this.open();
    }
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
