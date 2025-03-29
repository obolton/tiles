import { memo } from "react";
import { TextFormat } from "@/utils/richText/types";
import type {
  RichText,
  TextNode,
  ParagraphNode,
  HeadingNode,
  QuoteNode,
  ListNode,
  ListItemNode,
  Node,
} from "@/utils/richText/types";
import { ListType } from "@/utils/richText/types";

interface RichTextProps {
  content: RichText;
}

function renderNodes(nodes: Node[]) {
  return (
    <>
      {nodes.map((node, index) => {
        switch (node.type) {
          case "paragraph":
            return <Paragraph key={index} node={node} />;
          case "heading":
            return <Heading key={index} node={node} />;
          case "quote":
            return <Quote key={index} node={node} />;
          case "list":
            return <List key={index} node={node} />;
          case "text":
            return <Text key={index} node={node} />;
          default:
            return null;
        }
      })}
    </>
  );
}

function RichText({ content }: RichTextProps) {
  return renderNodes(content);
}

export default memo(RichText);

interface ParagraphProps {
  node: ParagraphNode;
}

function Paragraph({ node }: ParagraphProps) {
  if (node.children.length === 0) {
    return (
      <p>
        <br />
      </p>
    );
  }
  return <p>{renderNodes(node.children)}</p>;
}

interface HeadingProps {
  node: HeadingNode;
}

function getHeadingTag(level: number) {
  switch (level) {
    case 1:
      return "h1";
    case 2:
      return "h2";
    case 3:
      return "h3";
    default:
      return "h1";
  }
}

function Heading({ node }: HeadingProps) {
  const Tag = getHeadingTag(node.level);
  return (
    <Tag>
      {node.children.length === 0 ? <br /> : renderNodes(node.children)}
    </Tag>
  );
}

interface QuoteProps {
  node: QuoteNode;
}

function Quote({ node }: QuoteProps) {
  if (node.children.length === 0) {
    return (
      <blockquote>
        <br />
      </blockquote>
    );
  }
  return <blockquote>{renderNodes(node.children)}</blockquote>;
}

interface ListItemProps extends React.HTMLAttributes<HTMLLIElement> {
  node: ListItemNode;
}

function ListItem({ node, ...props }: ListItemProps) {
  if (node.children.length === 0) {
    return (
      <li {...props}>
        <br />
      </li>
    );
  }
  return <li {...props}>{renderNodes(node.children)}</li>;
}

interface ListProps {
  node: ListNode;
}

function List({ node }: ListProps) {
  switch (node.listType) {
    case ListType.ORDERED:
      return (
        <ol>
          {node.children.map((child, index) => (
            <ListItem key={index} node={child} />
          ))}
        </ol>
      );
    case ListType.UNORDERED:
      return (
        <ul>
          {node.children.map((child, index) => (
            <ListItem key={index} node={child} />
          ))}
        </ul>
      );
    case ListType.CHECK:
      return (
        <ul className="checklist">
          {node.children.map((child, index) => (
            <ListItem
              key={index}
              node={child}
              role={child.children[0]?.type === "list" ? undefined : "checkbox"}
              aria-checked={
                child.children[0]?.type === "list" ? undefined : child.checked
              }
            />
          ))}
        </ul>
      );
  }
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
  if (node.format & TextFormat.HIGHLIGHT) {
    content = <mark>{content}</mark>;
  }
  if (node.link) {
    content = (
      <a href={node.link} target="_blank" rel="noreferrer ugc">
        {content}
      </a>
    );
  }
  return content;
}
