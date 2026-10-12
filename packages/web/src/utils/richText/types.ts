import type { FontId } from "fonts/config";
import { TextFormat, ListType, TextAlignment } from "doc/types/richText";

export { TextFormat, ListType, TextAlignment };

export interface BaseNode {
  type: string;
}

export interface TextNode extends BaseNode {
  type: "text";
  text: string;
  format: number;
  size?: number;
  color?: string;
  font?: FontId;
  pending?: boolean;
}

export interface LinkNode extends BaseNode {
  type: "link";
  href: string;
  theme?: string;
  children: TextNode[];
}

export interface DateNode extends BaseNode {
  type: "date";
  value: string;
  format: number;
  size?: number;
  color?: string;
  font?: FontId;
  theme?: string | null;
}

export interface DropdownNode extends BaseNode {
  type: "dropdown";
  dropdownType: string;
  value: string;
  format: number;
  size?: number;
  color?: string;
  font?: FontId;
}

export interface MentionNode extends BaseNode {
  type: "mention";
  userId: string;
  displayName: string;
  format: number;
  size?: number;
  color?: string;
  font?: FontId;
}

export interface PendingNode extends BaseNode {
  type: "pending";
  children: Exclude<BlockNode, { type: "pending" }>[];
}

export interface BlockStyle {
  align?: TextAlignment;
  lineHeight?: number;
  indent?: number;
}

export interface ParagraphNode extends BaseNode, BlockStyle {
  type: "paragraph";
  children: InlineNode[];
}

export interface HeadingNode extends BaseNode, BlockStyle {
  type: "heading";
  level: 1 | 2 | 3;
  theme?: string;
  children: InlineNode[];
}

export interface QuoteNode extends BaseNode {
  type: "quote";
  children: Exclude<BlockNode, { type: "quote" | "pending" }>[];
}

export interface CodeNode extends BaseNode {
  type: "code";
  language: string;
  lineNumbers: boolean;
  children: TextNode[];
}

export interface DividerNode extends BaseNode {
  type: "divider";
}

export interface ListNode extends BaseNode {
  type: "list";
  listType: ListType;
  children: ListItemNode[];
}

export interface ListItemNode extends BaseNode {
  type: "listitem";
  checked?: boolean;
  children: BlockNode[];
}

export type InlineNode = TextNode | LinkNode | DateNode | DropdownNode | MentionNode;

export type BlockNode =
  | PendingNode
  | ParagraphNode
  | ListNode
  | HeadingNode
  | QuoteNode
  | CodeNode
  | DividerNode;

export type Node =
  | TextNode
  | LinkNode
  | DateNode
  | ParagraphNode
  | HeadingNode
  | QuoteNode
  | ListNode
  | ListItemNode
  | PendingNode
  | CodeNode
  | DividerNode
  | DropdownNode
  | MentionNode;

export type RichText = BlockNode[];
