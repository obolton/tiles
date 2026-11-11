import { prosemirrorToYXmlFragment } from "y-prosemirror";
import StreamRenderer from "@/components/chat/StreamRenderer";
import Text from "@/models/Text";
import { deserialize } from "@/utils/richText/deserialize";
import type Page from "@/models/Page";
import type {
  AssistantMessage,
  ChatReference,
  MessageEvent,
  UserMessage,
} from "@/components/chat/types";

export const SHORT_RESPONSE: MessageEvent[] = [
  "I've added a ",
  { bold: true },
  "summary",
  { bold: false },
  " section above the timeline, and tightened the intro so it fits on one slide.",
];

export const RICH_RESPONSE: MessageEvent[] = [
  { type: "heading", level: 3 },
  "Launch checklist",
  { type: "paragraph" },
  "Here's what's left before the ",
  { italic: true },
  "spring launch",
  { italic: false },
  ":",
  { type: "listitem", listType: "unordered", depth: 0 },
  "Finalize the ",
  { bold: true },
  "pricing table",
  { bold: false },
  { type: "listitem", listType: "unordered", depth: 0 },
  "Record the product walkthrough",
  { type: "listitem", listType: "unordered", depth: 1 },
  "Script approved by marketing",
  { type: "listitem", listType: "unordered", depth: 0 },
  "Publish the landing page",
  { type: "code", language: "ts", lineNumbers: false },
  'const launchDate = new Date("2027-03-01");',
  { type: "paragraph" },
  "Would you like me to turn this into a checklist on the page?",
];

export const REFERENCES: ChatReference[] = [
  { id: "summary", type: "TEXT" },
  { id: "pricing", type: "TABLE" },
  { id: "growth", type: "CHART" },
];

/** Creates a text tile to attach as a prompt reference, returning its ID. */
export function createTextTile(page: Page, text: string): string {
  const tile = page.createTile(Text.createMap({}), {});
  if (tile instanceof Text) {
    // Content passed to `Text.createMap` is not retained once the map is added to the doc
    prosemirrorToYXmlFragment(
      deserialize([{ type: "paragraph", align: 0, children: [{ type: "text", text, format: 0 }] }]),
      tile.contentFragment,
    );
  }
  return tile.id;
}

export function renderResponse(events: MessageEvent[]): HTMLElement {
  const renderer = new StreamRenderer();
  for (const event of events) {
    renderer.append(event);
  }
  return renderer.container;
}

export function userMessage(content: string): UserMessage {
  return { id: crypto.randomUUID(), role: "user", content };
}

export function assistantMessage(
  events: MessageEvent[],
  references?: ChatReference[],
): AssistantMessage {
  return {
    id: crypto.randomUUID(),
    role: "assistant",
    content: events.length ? renderResponse(events) : undefined,
    references,
  };
}
