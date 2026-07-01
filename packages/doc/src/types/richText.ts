export enum TextFormat {
  NONE = 0,
  BOLD = 1,
  ITALIC = 1 << 1,
  STRIKETHROUGH = 1 << 2,
  UNDERLINE = 1 << 3,
  HIGHLIGHT = 1 << 4,
  SUPERSCRIPT = 1 << 5,
  SUBSCRIPT = 1 << 6,
  SMALL_CAPS = 1 << 7,
  CODE = 1 << 8,
}

export enum ListType {
  ORDERED = 0,
  UNORDERED = 1,
  CHECK = 2,
}

export enum TextAlignment {
  LEFT = 0,
  CENTER = 1,
  RIGHT = 2,
  JUSTIFY = 3,
}

interface TextNode {
  type: "text";
  text: string;
  format: number;
  size?: number;
  color?: string;
  font?: string;
  pending?: boolean;
}

interface LinkNode {
  type: "link";
  href: string;
  theme?: string;
  children: TextNode[];
}

interface DateNode {
  type: "date";
  value: string;
  format: number;
  size?: number;
  color?: string;
  font?: string;
  theme?: string | null;
}

interface DropdownNode {
  type: "dropdown";
  dropdownType: string;
  value: string;
  format: number;
  size?: number;
  color?: string;
  font?: string;
}

interface MentionNode {
  type: "mention";
  userId: string;
  displayName: string;
  format: number;
  size?: number;
  color?: string;
  font?: string;
}

type InlineNode = TextNode | LinkNode | DateNode | DropdownNode | MentionNode;

interface ParagraphNode {
  type: "paragraph";
  align?: TextAlignment;
  lineHeight?: number;
  indent?: number;
  children: InlineNode[];
}

interface HeadingNode {
  type: "heading";
  level: 1 | 2 | 3;
  align?: TextAlignment;
  lineHeight?: number;
  indent?: number;
  theme?: string;
  children: InlineNode[];
}

interface ListItemNode {
  type: "listitem";
  checked?: boolean;
  children: BlockNode[];
}

interface ListNode {
  type: "list";
  listType: ListType;
  children: ListItemNode[];
}

interface CodeNode {
  type: "code";
  language: string;
  lineNumbers: boolean;
  children: TextNode[];
}

interface DividerNode {
  type: "divider";
}

interface QuoteNode {
  type: "quote";
  children: (ParagraphNode | HeadingNode | ListNode | CodeNode | DividerNode)[];
}

interface PendingNode {
  type: "pending";
  children: (ParagraphNode | HeadingNode | ListNode | QuoteNode | CodeNode | DividerNode)[];
}

type BlockNode =
  | ParagraphNode
  | HeadingNode
  | QuoteNode
  | ListNode
  | PendingNode
  | CodeNode
  | DividerNode;

export type RichText = BlockNode[];
