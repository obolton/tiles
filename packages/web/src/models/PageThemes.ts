import * as Y from "yjs";
import { BaseReactive } from "reactivity";
import type Theme from "@/models/Theme";
import type { ThemeData } from "@/models/Theme";

/**
 * Per-page snapshot store for applied themes. The doc's `themes` Y.Map holds
 * an immutable snapshot of each theme at the moment it was applied; tiles and
 * the page itself reference snapshots by id. Re-applying a theme overwrites
 * its snapshot.
 *
 * The instance is itself reactive — `value` is the underlying Y.Map.
 * Subscribers are notified on any entry change.
 *
 * TODO: prune snapshots no longer referenced by any tile or the page. Lingers
 * for now — small payload, no correctness impact.
 */
export default class PageThemes extends BaseReactive<Y.Map<ThemeData>> {
  private readonly themesMap: Y.Map<ThemeData>;
  private readonly onMapChange = () => this.notify();

  constructor(doc: Y.Doc) {
    super();
    this.themesMap = doc.getMap<ThemeData>("themes");
    this.themesMap.observe(this.onMapChange);
  }

  get value(): Y.Map<ThemeData> {
    return this.themesMap;
  }

  apply(theme: Theme) {
    this.themesMap.set(theme.id, theme.serialize());
  }

  dispose() {
    this.themesMap.unobserve(this.onMapChange);
    this.disconnect();
  }
}
