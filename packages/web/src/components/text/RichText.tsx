import { TextFormat } from "@/utils/richText/types";
import { ListType } from "@/utils/richText/types";
import ThemeVariant from "@/components/themes/ThemeVariant";
import { DATE_THEMES, DEFAULT_DATE_THEME } from "@/components/dates/themes";
import { LINK_THEMES, DEFAULT_LINK_THEME } from "@/components/links/themes";
import {
  HEADING_THEMES,
  DEFAULT_HEADING_THEME,
} from "@/components/headings/themes";
import { reactive } from "@/utils/reactivity";
import type {
  RichText,
  ParagraphNode,
  HeadingNode,
  QuoteNode,
  ListNode,
  ListItemNode,
  Node,
  TextAlignment,
  LinkNode,
} from "@/utils/richText/types";
import type { JSX } from "@/jsx/jsx";

interface RichTextProps {
  content: RichText;
}

function renderNodes(nodes: Node[]) {
  return (
    <>
      {nodes.map((node) => {
        switch (node.type) {
          case "paragraph":
            return <Paragraph node={node} />;
          case "heading":
            return <Heading node={node} />;
          case "quote":
            return <Quote node={node} />;
          case "list":
            return <List node={node} />;
          case "text":
            return node.pending ? null : (
              <FormattedText format={node.format}>{node.text}</FormattedText>
            );
          case "link":
            return <Link node={node} />;
          case "date":
            return (
              <FormattedText format={node.format}>
                <ThemeVariant
                  theme={node.theme ?? DEFAULT_DATE_THEME}
                  registry={DATE_THEMES}
                  value={reactive(new Date(node.value))}
                  time={reactive(node.value.length > 10)}
                />
              </FormattedText>
            );
          default:
            return null;
        }
      })}
    </>
  );
}

function RichTextRoot({ content }: RichTextProps) {
  return renderNodes(content);
}

export default RichTextRoot;

function getTextAlignment(align?: TextAlignment) {
  switch (align) {
    case 0:
      return "left";
    case 1:
      return "center";
    case 2:
      return "right";
    default:
      return undefined;
  }
}

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
    <p className={getTextAlignment(node.align)}>{renderNodes(node.children)}</p>
  );
}

interface HeadingProps {
  node: HeadingNode;
}

function Heading({ node }: HeadingProps) {
  return (
    <ThemeVariant
      theme={node.theme ?? DEFAULT_HEADING_THEME}
      registry={HEADING_THEMES}
      level={node.level}
      align={getTextAlignment(node.align)}
    >
      {renderNodes(node.children)}
    </ThemeVariant>
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

interface ListItemProps extends JSX.Attributes<HTMLLIElement> {
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
          {node.children.map((child) => (
            <ListItem node={child} />
          ))}
        </ol>
      );
    case ListType.UNORDERED:
      return (
        <ul>
          {node.children.map((child) => (
            <ListItem node={child} />
          ))}
        </ul>
      );
    case ListType.CHECK:
      return (
        <ul className="checklist">
          {node.children.map((child) => (
            <ListItem
              node={child}
              role={child.children[0]?.type === "list" ? undefined : "checkbox"}
              aria-checked={
                child.children[0]?.type === "list"
                  ? undefined
                  : child.checked
                    ? "true"
                    : "false"
              }
            />
          ))}
        </ul>
      );
  }
}

interface LinkProps {
  node: LinkNode;
}

function Link({ node }: LinkProps) {
  return (
    <ThemeVariant
      theme={node.theme ?? DEFAULT_LINK_THEME}
      registry={LINK_THEMES}
      href={reactive(node.href)}
    >
      {renderNodes(node.children)}
    </ThemeVariant>
  );
}

interface FormattedTextProps {
  format: TextFormat;
  children: JSX.Node;
}

function FormattedText({ format, children }: FormattedTextProps) {
  let content = children;
  if (format & TextFormat.BOLD) {
    content = <strong>{content}</strong>;
  }
  if (format & TextFormat.ITALIC) {
    content = <em>{content}</em>;
  }
  if (format & TextFormat.STRIKETHROUGH) {
    content = <del>{content}</del>;
  }
  if (format & TextFormat.UNDERLINE) {
    content = <span className="underline">{content}</span>;
  }
  if (format & TextFormat.HIGHLIGHT) {
    content = <mark>{content}</mark>;
  }
  return content;
}
