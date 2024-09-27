import { memo } from "react";
import { TextFormat } from "@/utils/richText/types";
import type {
  RichText,
  TextNode,
  ParagraphNode,
  ListNode,
  ListItemNode,
} from "@/utils/richText/types";
import { ListType } from "@/utils/richText/types";

interface RichTextProps {
  content: RichText;
}

function RichText({ content }: RichTextProps) {
  return (
    <>
      {content.map((node, index) => {
        switch (node.type) {
          case "paragraph":
            return <Paragraph key={index} node={node} />;
          case "list":
            return <List key={index} node={node} />;
          default:
            return null;
        }
      })}
    </>
  );
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
  return (
    <p>
      {node.children.map((child, index) => (
        <Text key={index} node={child} />
      ))}
    </p>
  );
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
  return (
    <li value={node.value}>
      {node.children.map((child, index) => {
        switch (child.type) {
          case "text":
            return <Text key={index} node={child} />;
          case "list":
            return <List key={index} node={child} />;
        }
      })}
    </li>
  );
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
