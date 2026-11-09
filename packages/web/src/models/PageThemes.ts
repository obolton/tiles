import * as Y from "yjs";
import { BaseReactive } from "carillon";
import type Theme from "@/models/Theme";
import type { ThemeData } from "@/models/Theme";

/** Transaction origin for snapshot refreshes while a theme is being edited; not an undo step. */
export const THEME_EDIT_ORIGIN = "theme-edit";

/**
 * Per-page snapshot store for applied themes. The doc's `themes` Y.Map holds a snapshot of each
 * theme at the moment it was applied, and the page and its tiles reference snapshots by id, so
 * editing a workspace theme changes a page only when the theme is applied to it again.
 *
 * The instance is itself reactive: `value` is the underlying Y.Map, and subscribers are notified
 * on any entry change.
 */
export default class PageThemes extends BaseReactive<Y.Map<ThemeData>> {
  private readonly doc: Y.Doc;
  private readonly themesMap: Y.Map<ThemeData>;
  private readonly onMapChange = () => this.notify();

  constructor(doc: Y.Doc) {
    super();
    this.doc = doc;
    this.themesMap = doc.getMap<ThemeData>("themes");
    this.themesMap.observe(this.onMapChange);
  }

  get value(): Y.Map<ThemeData> {
    return this.themesMap;
  }

  apply(theme: Theme) {
    this.themesMap.set(theme.id, theme.serialize());
  }

  /** Updates the snapshot of a theme the page already uses, so edits preview live on this page. */
  refresh(theme: Theme) {
    if (!this.themesMap.has(theme.id)) {
      return;
    }
    this.doc.transact(() => this.themesMap.set(theme.id, theme.serialize()), THEME_EDIT_ORIGIN);
  }

  delete(id: string) {
    this.themesMap.delete(id);
  }

  dispose() {
    this.themesMap.unobserve(this.onMapChange);
    this.disconnect();
  }
}
