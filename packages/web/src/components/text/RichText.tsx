import { memo } from "react";
import { TextFormat } from "@/utils/richText/types";
import type { RichText, BlockNode, TextNode } from "@/utils/richText/types";

interface RichTextProps {
  content: RichText;
}

function RichText({ content }: RichTextProps) {
  return (
    <>
      {content.map((block, index) => {
        switch (block.type) {
          case "paragraph":
            return <Paragraph key={index} node={block} />;
          default:
            return null;
        }
      })}
    </>
  );
}

export default memo(RichText);

interface ParagraphProps {
  node: BlockNode;
}

function Paragraph({ node }: ParagraphProps) {
  return (
    <p>
      {node.spans.map((span, index) => (
        <Text key={index} node={span} />
      ))}
    </p>
  );
}

interface TextProps {
  node: TextNode;
}

function Text({ node }: TextProps) {
  let content = <>{node.text}</>;
  if (node.format & TextFormat.BOLD) {
    content = <strong>{content}</strong>;
  }
  if (node.format & TextFormat.ITALIC) {
    content = <em>{content}</em>;
  }
  if (node.format & TextFormat.STRIKETHROUGH) {
    content = <del>{content}</del>;
  }
  if (node.format & TextFormat.UNDERLINE) {
    content = <span className="underline">{content}</span>;
  }
  return content;
}
