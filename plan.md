# Embedding Rich Content in Text Tiles

## Problem

Currently, rich content (images, tables, charts) and text content live in separate tiles. To intersperse an image within a document's text, a user must split the text into two tiles and place the image tile between them. This is cumbersome and limits the natural flow of document authoring.

## Current Architecture Summary

- **Text tiles** use a ProseMirror-based rich text editor with a custom schema (`packages/web/src/utils/richText/schema.ts`).
- The schema already supports several **block-level nodes** (paragraph, heading, quote, code, divider, lists) and **inline atoms** (date, dropdown, mention, link).
- Complex NodeViews are already used — the **code block** embeds a full CodeMirror editor inside ProseMirror (`utils/richText/code/CodeNodeView.tsx`).
- **Non-text content** (images, tables, charts, videos, maps, links) are separate tile types, each with their own database model, API routes, client model, and rendering components.
- Rich text is serialized to a custom `RichText` JSON format (`types.ts`) and stored in the database. The serialization/deserialization layer is cleanly separated (`serialize.ts`, `deserialize.ts`).
- There is a clean display-mode renderer (`components/text/RichText.tsx`) that renders serialized content as read-only JSX.

## Proposed Solution: ProseMirror Block-Level Embed Nodes

Add new **block-level node types** to the ProseMirror schema that represent embedded rich content. These nodes are rendered using **custom NodeViews** — the same pattern already proven by the code block implementation. The embedded content lives _inside_ the text tile's ProseMirror document, not as separate tiles.

### New Schema Nodes

Add the following block-level node types to the ProseMirror schema:

| Node | Attributes | Content | Description |
|------|-----------|---------|-------------|
| `embed_image` | `src`, `alt`, `width`, `alignment`, `caption` | Leaf (atom) | Inline/block image with optional caption |
| `embed_table` | `columns`, `rows`, `data` | Leaf (atom) | Embedded table with data stored in node attrs |
| `embed_chart` | `chartType`, `labelColumn`, `series`, `data` | Leaf (atom) | Chart rendered from inline data |

Each node is an **atom** (not editable via normal text input) rendered by a custom NodeView that encapsulates the full interactive editing experience.

### Data Model Changes

Extend the `RichText` type system with new block node types:

```typescript
interface EmbedImageNode {
  type: "embed_image";
  src: string;       // Image URL or image ID reference
  alt?: string;
  width?: number;    // Percentage or pixel width
  alignment?: "left" | "center" | "right";
  caption?: InlineNode[];
}

interface EmbedTableNode {
  type: "embed_table";
  columns: EmbedTableColumn[];
  rows: EmbedTableRow[];
}

interface EmbedChartNode {
  type: "embed_chart";
  chartType: "BAR" | "LINE" | "AREA";
  labelColumnIndex?: number;
  series: EmbedChartSeries[];
  data: EmbedTableRow[];  // Reuse table data structure
}
```

These are added to the `BlockNode` union and handled in `serialize.ts` / `deserialize.ts`.

### NodeView Implementations

Each embed type gets a custom NodeView class (following the `CodeNodeView` pattern):

1. **`EmbedImageNodeView`** — Renders an image with resize handles and an optional caption editor. In edit mode, clicking shows controls for changing the image, adjusting width/alignment, and editing alt text. In view mode, renders the image with caption.

2. **`EmbedTableNodeView`** — Renders an inline table editor. Reuses the existing `<table-view>` web component, adapted to read/write from ProseMirror node attributes instead of the Table tile API. Changes are dispatched as ProseMirror transactions.

3. **`EmbedChartNodeView`** — Renders an inline chart. Reuses the existing `<chart-view>` web component with data sourced from the node's attributes.

### Insertion UX

Extend the existing "Insert content" dropdown menu in the text formatting toolbar (`FormattingTools.tsx`) with new options:

- **Image** — Opens the existing image upload modal, then inserts an `embed_image` node at the cursor position
- **Table** — Inserts an `embed_table` node with a default 3×3 grid
- **Chart** — Inserts an `embed_chart` node (requires table data, could prompt user or insert with sample data)

Additionally, add **slash command** support within the text editor: typing `/` at the start of a line opens a quick-insert menu (similar to Notion). This provides a discoverable, keyboard-friendly way to insert embeds without reaching for the toolbar.

### Toolbar Behavior

When the cursor is inside an embed node, the text toolbar could show contextual controls:

- **Image**: Width slider, alignment buttons, alt text field, replace image button
- **Table**: Column/row add/remove buttons, cell formatting
- **Chart**: Chart type selector, series configuration

This reuses the existing floating toolbar infrastructure.

### Display Mode

The `RichText.tsx` display component is extended to render the new node types, reusing the same web components (`<table-view>`, `<chart-view>`) in read-only mode.

---

## Alternatives Considered

### Alternative A: Tile References in Text (Hybrid Approach)

Instead of storing embed data inside the ProseMirror document, store a **reference** to an existing tile.

**Schema:**
```typescript
// Single generic node type
interface TileRefNode {
  type: "tile_ref";
  tileId: string;    // References an existing tile on the page
}
```

**How it works:**
- The ProseMirror document contains lightweight reference nodes
- When rendered (in both edit and view mode), the node resolves the `tileId` to the actual tile model and renders its component
- The referenced tile's data continues to live in its own database table (ImageTile, Table, etc.)
- Creating an embed creates a real tile (hidden from the page layout) and inserts a reference

**Pros:**
- Reuses all existing tile infrastructure (models, API routes, components) with minimal changes
- No data duplication — single source of truth per content type
- Undo/redo for tile content handled by existing operation system
- Tiles can be "promoted" from embed to standalone (or vice versa) by adding/removing the reference

**Cons:**
- Introduces coupling between text content and the tile system — deleting a referenced tile could break text content
- More complex data lifecycle (orphaned tiles, cascading deletes)
- ProseMirror undo/redo doesn't naturally cover changes to external tile data
- Serialization becomes more complex (need to resolve references on load)
- Copy/paste of text with embeds requires duplicating the referenced tiles

### Alternative B: Section-Level Document Mode

Instead of extending the text editor, add a new **document layout mode** to sections.

**How it works:**
- A new section layout type (`DOCUMENT`) renders its child tiles in a linear, document-like flow
- Text tiles in document mode automatically flow together (no visible boundaries between adjacent text tiles)
- Non-text tiles (images, tables, etc.) are rendered inline between text blocks with document-appropriate styling (centered, captioned, etc.)
- The insert menu gains a document-aware mode that inserts tiles between text blocks at the cursor position

**Pros:**
- No changes to ProseMirror schema or text editor at all
- Leverages existing tile system completely
- Each content type retains its own editing experience
- Simple mental model: tiles in a document flow

**Cons:**
- Doesn't solve the fundamental problem — content is still in separate tiles, just visually stitched together
- Complex cursor navigation between tiles (jumping between ProseMirror instances)
- Text selection across tile boundaries is difficult to implement well
- Less precise control over embed positioning (always between paragraphs, not inline)
- Significant work to make the inter-tile transitions seamless

### Alternative C: ProseMirror Inline Embeds (Proposed Solution, detailed above)

This is the recommended approach, described in detail in the main proposal.

**Pros:**
- Natural document authoring — embeds are part of the text flow
- Standard ProseMirror patterns (NodeViews, atoms) — well-documented, proven approach
- Undo/redo works seamlessly (all changes are ProseMirror transactions)
- Copy/paste works naturally (embeds are part of the document)
- Clean separation — embed data is self-contained in the ProseMirror document
- Slash commands and input rules provide a delightful insertion experience
- The code block NodeView already proves this pattern works in this codebase

**Cons:**
- Embed data stored inside the RichText JSON — could make text tile payloads larger (especially for tables with many rows)
- Need to build NodeView implementations for each embed type (images, tables, charts)
- Table/chart embeds are simpler versions of the standalone tile variants (can't share all the same editing UI without adaptation)
- Image uploads need to be handled within the text editor context rather than the tile creation flow

---

## Recommendation

**Alternative C (ProseMirror Inline Embeds)** is recommended as the primary approach. It provides the most natural authoring experience and aligns with how modern document editors (Notion, Google Docs, Confluence) handle embedded content. The existing NodeView infrastructure (code blocks) proves the pattern is viable in this codebase.

For **Phase 1**, start with embedded images — they are the most commonly needed embed type and have the simplest data model. This validates the pattern before tackling tables and charts.

## Implementation Plan

### Phase 1: Embedded Images

1. **Schema & types**: Add `embed_image` node to ProseMirror schema and `EmbedImageNode` to `RichText` types
2. **Serialization**: Add serialize/deserialize support for the new node type
3. **NodeView**: Implement `EmbedImageNodeView` with image display, resize handles, caption editing, and alignment controls
4. **Insertion**: Add "Image" option to the text toolbar's "Insert content" menu; implement slash command `/image`
5. **Display**: Extend `RichText.tsx` to render `embed_image` nodes in view mode
6. **Image upload**: Integrate the existing image upload flow for use within the text editor
7. **API changes**: Ensure the text tile API handles the larger `content` payloads; add image reference tracking so embedded images aren't garbage-collected

### Phase 2: Embedded Tables

1. **Schema & types**: Add `embed_table` node
2. **NodeView**: Adapt `<table-view>` for use inside ProseMirror, reading/writing from node attributes
3. **Insertion**: Add "Table" option to insert menu; implement `/table` slash command
4. **Display**: Extend view-mode renderer

### Phase 3: Embedded Charts

1. **Schema & types**: Add `embed_chart` node
2. **NodeView**: Adapt `<chart-view>` for embedded use
3. **Insertion & display**: Follow the same pattern as tables

### Phase 4: Slash Commands & Polish

1. **Slash command menu**: Implement `/` trigger at line start to open a filterable insert menu
2. **Drag-and-drop**: Support dragging images from the filesystem directly into the text editor to create embeds
3. **Paste handling**: Detect pasted images/URLs and offer to create embeds
4. **Keyboard navigation**: Ensure arrow keys, selection, and deletion work smoothly around embed nodes
