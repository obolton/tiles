import type * as Y from "yjs";
import { getBody } from "../body";
import { getChildren } from "../placement/ordering";
import { dockParentId } from "../placement/parentId";
import type { PageType } from "../types/enums";
import { escapeText } from "./inline";
import { fragmentToMarkdown } from "./richText";
import { renderTile, type TileMarkdownOptions } from "./tiles";

export interface PageMarkdownOptions extends Pick<TileMarkdownOptions, "imageUrl" | "pageUrl"> {
  title: string;
  type: PageType;
}

/** A layout page's containers in reading order: top and left docks, the page, right and bottom docks. */
const LAYOUT_PAGE_PARENTS = [
  dockParentId("TOP"),
  dockParentId("LEFT"),
  null,
  dockParentId("RIGHT"),
  dockParentId("BOTTOM"),
];

/**
 * Serializes a page's document to Markdown, headed by the page title. Hidden tiles are left out.
 */
export function pageToMarkdown(doc: Y.Doc, { title, type, ...urls }: PageMarkdownOptions): string {
  const options: TileMarkdownOptions = { tiles: doc.getMap<Y.Map<unknown>>("tiles"), ...urls };
  const heading = title.trim() ? `# ${escapeText(title.trim())}` : "";
  const content = renderContent(doc, type, options);
  return `${[heading, content].filter((part) => part.length > 0).join("\n\n")}\n`;
}

function renderContent(doc: Y.Doc, type: PageType, options: TileMarkdownOptions): string {
  const render = (id: string) => renderTile(id, options);
  switch (type) {
    case "DOCUMENT":
      // Root tiles are embedded in the body, which orders them
      return fragmentToMarkdown(getBody(doc), { tile: render });
    case "PRESENTATION":
      return getChildren(options.tiles, null)
        .filter(({ id }) => options.tiles.get(id)?.get("type") === "SECTION")
        .map(({ id }) => render(id))
        .filter((slide) => slide.length > 0)
        .join("\n\n---\n\n");
    case "LAYOUT":
      return LAYOUT_PAGE_PARENTS.flatMap((parent) => getChildren(options.tiles, parent))
        .map(({ id }) => render(id))
        .filter((tile) => tile.length > 0)
        .join("\n\n");
  }
}
