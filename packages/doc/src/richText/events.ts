export interface ParagraphNode {
  type: "paragraph";
}

export interface HeadingNode {
  type: "heading";
  level: number;
}

export interface ListItemNode {
  type: "listitem";
  listType: "ordered" | "unordered";
  depth: number;
}

export interface DividerNode {
  type: "divider";
}

export interface CodeNode {
  type: "code";
  language: string;
  lineNumbers: boolean;
}

export type RichTextNode =
  | ParagraphNode
  | HeadingNode
  | ListItemNode
  | DividerNode
  | CodeNode;

export interface RichTextFormat {
  bold?: boolean;
  italic?: boolean;
}

export type DestinationMode = "insert" | "replace" | "append" | "prepend";

export interface Destination {
  destination: number | null;
  mode?: DestinationMode;
}

export type RichTextContent = string | RichTextFormat | RichTextNode;

export type RichTextStreamEvent = RichTextContent | Destination;
