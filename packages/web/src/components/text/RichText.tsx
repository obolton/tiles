import { memo } from "react";
import { TextFormat } from "@/utils/richText/types";
import type {
  RichText,
  TextNode,
  ParagraphNode,
  HeadingNode,
  LinkNode,
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
          case "link":
            return <Link key={index} node={node} />;
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

function Heading({ node }: HeadingProps) {
  if (node.children.length === 0) {
    return (
      <h2>
        <br />
      </h2>
    );
  }
  return <h2>{renderNodes(node.children)}</h2>;
}

interface LinkProps {
  node: LinkNode;
}

function Link({ node }: LinkProps) {
  if (node.children.length === 0) {
    return <span />;
  }
  return (
    <a href={node.url} target="_blank" rel="noreferrer ugc">
      {renderNodes(node.children)}
    </a>
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

interface ListItemProps {
  node: ListItemNode;
}

function ListItem({ node }: ListItemProps) {
  if (node.children.length === 0) {
    return (
      <li value={node.value}>
        <br />
      </li>
    );
  }
  return <li value={node.value}>{renderNodes(node.children)}</li>;
}

interface ListProps {
  node: ListNode;
}

function List({ node }: ListProps) {
  if (node.listType === ListType.ORDERED) {
    return (
      <ol>
        {node.children.map((child, index) => (
          <ListItem key={index} node={child} />
        ))}
      </ol>
    );
  } else {
    return (
      <ul>
        {node.children.map((child, index) => (
          <ListItem key={index} node={child} />
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
  return content;
}
