export enum TextFormat {
  NONE = 0,
  BOLD = 1,
  ITALIC = 1 << 1,
  STRIKETHROUGH = 1 << 2,
  UNDERLINE = 1 << 3,
}

export interface BaseNode {
  type: string;
}

export interface TextNode extends BaseNode {
  type: "text";
  text: string;
  format: number;
}

export interface ParagraphNode extends BaseNode {
  type: "paragraph";
  spans: TextNode[];
}

export type BlockNode = ParagraphNode;

export type BlockNodeType = BlockNode["type"];

export type RichText = BlockNode[];
