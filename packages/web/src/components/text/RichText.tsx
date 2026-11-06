import { TextFormat, TextAlignment, ListType } from "doc/types/richText";
import { toCSSColor } from "@/utils/color";
import ThemeVariant from "@/components/themes/ThemeVariant";
import { DATE_THEMES, DEFAULT_DATE_THEME } from "@/components/dates/themes";
import { LINK_THEMES, DEFAULT_LINK_THEME } from "@/components/links/themes";
import { HEADING_THEMES, DEFAULT_HEADING_THEME } from "@/components/headings/themes";
import { MIN_TEXT_SIZE, MAX_TEXT_SIZE } from "@/constants/formatting";
import { reactive } from "reactivity";
import { getFontConfig, type FontId } from "fonts/config";
import Code from "./Code";
import type {
  RichText,
  ParagraphNode,
  HeadingNode,
  QuoteNode,
  ListNode,
  ListItemNode,
  Node,
  LinkNode,
  MentionNode,
} from "doc/types/richText";
import type { JSX } from "jsx/jsx";

export interface RenderOptions {
  /** Renders an embedded tile by id. Tiles render nothing without it. */
  renderTile?: (id: string) => JSX.Node;
}

interface RichTextProps extends RenderOptions {
  content: RichText;
}

function renderNodes(nodes: Node[], options: RenderOptions = {}) {
  return (
    <>
      {nodes.map((node) => {
        switch (node.type) {
          case "paragraph":
            return <Paragraph node={node} />;
          case "heading":
            return <Heading node={node} />;
          case "quote":
            return <Quote node={node} options={options} />;
          case "code":
            return <Code node={node} />;
          case "list":
            return <List node={node} options={options} />;
          case "tile":
            return options.renderTile?.(node.id) ?? null;
          case "text":
            return node.pending ? null : (
              <FormattedText
                format={node.format}
                size={node.size}
                color={node.color}
                font={node.font}
              >
                {node.text}
              </FormattedText>
            );
          case "link":
            return <Link node={node} />;
          case "date":
            return (
              <FormattedText
                format={node.format}
                size={node.size}
                color={node.color}
                font={node.font}
              >
                <ThemeVariant
                  theme={node.theme ?? DEFAULT_DATE_THEME}
                  registry={DATE_THEMES}
                  value={reactive(new Date(node.value))}
                  time={reactive(node.value.length > 10)}
                />
              </FormattedText>
            );
          case "dropdown":
            return (
              <FormattedText
                format={node.format}
                size={node.size}
                color={node.color}
                font={node.font}
              >
                {node.value}
              </FormattedText>
            );
          case "mention":
            return <Mention node={node} />;
          case "divider":
            return <hr />;
          default:
            return null;
        }
      })}
    </>
  );
}

function RichTextRoot({ content, renderTile }: RichTextProps) {
  return renderNodes(content, { renderTile });
}

export default RichTextRoot;

function getTextAlignment(align?: TextAlignment) {
  switch (align) {
    case TextAlignment.LEFT:
      return "left";
    case TextAlignment.CENTER:
      return "center";
    case TextAlignment.RIGHT:
      return "right";
    case TextAlignment.JUSTIFY:
      return "justify";
    default:
      return undefined;
  }
}

interface ParagraphProps {
  node: ParagraphNode;
}

function Paragraph({ node }: ParagraphProps) {
  return (
    <p
      className={getTextAlignment(node.align)}
      style={{ lineHeight: node.lineHeight, "--indent": node.indent }}
    >
      {node.children.length > 0 ? renderNodes(node.children) : <br />}
    </p>
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
      lineHeight={node.lineHeight}
      indent={node.indent}
    >
      {node.children.length > 0 ? renderNodes(node.children) : <br />}
    </ThemeVariant>
  );
}

interface QuoteProps {
  node: QuoteNode;
  options: RenderOptions;
}

function Quote({ node, options }: QuoteProps) {
  return (
    <blockquote>
      {node.children.length > 0 ? renderNodes(node.children, options) : <br />}
    </blockquote>
  );
}

interface ListItemProps extends JSX.Attributes<"li"> {
  node: ListItemNode;
  options: RenderOptions;
}

function ListItem({ node, options, ...props }: ListItemProps) {
  return (
    <li {...props}>{node.children.length > 0 ? renderNodes(node.children, options) : <br />}</li>
  );
}

interface ListProps {
  node: ListNode;
  options: RenderOptions;
}

function List({ node, options }: ListProps) {
  switch (node.listType) {
    case ListType.ORDERED:
      return (
        <ol>
          {node.children.map((child) => (
            <ListItem node={child} options={options} />
          ))}
        </ol>
      );
    case ListType.UNORDERED:
      return (
        <ul>
          {node.children.map((child) => (
            <ListItem node={child} options={options} />
          ))}
        </ul>
      );
    case ListType.CHECK:
      return (
        <ul className="checklist">
          {node.children.map((child) => (
            <ListItem
              node={child}
              options={options}
              role={child.children[0]?.type === "list" ? undefined : "checkbox"}
              aria-checked={
                child.children[0]?.type === "list" ? undefined : child.checked ? "true" : "false"
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

interface MentionProps {
  node: MentionNode;
}

function Mention({ node }: MentionProps) {
  return (
    <FormattedText format={node.format} size={node.size} color={node.color} font={node.font}>
      <span className="mention">{node.displayName}</span>
    </FormattedText>
  );
}

interface FormattedTextProps {
  format: TextFormat;
  size?: number;
  color?: string;
  font?: FontId;
  children: JSX.Node;
}

function FormattedText({ format, size, color, font, children }: FormattedTextProps) {
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
  if (format & TextFormat.SUPERSCRIPT) {
    content = <sup>{content}</sup>;
  }
  if (format & TextFormat.SUBSCRIPT) {
    content = <sub>{content}</sub>;
  }
  if (format & TextFormat.SMALL_CAPS) {
    content = <span className="small-caps">{content}</span>;
  }
  if (typeof size === "number" || typeof color === "string" || typeof font === "string") {
    const style: Record<string, string> = {};
    if (typeof size === "number") {
      style.fontSize = Math.min(Math.max(size, MIN_TEXT_SIZE), MAX_TEXT_SIZE) + "em";
    }
    if (typeof color === "string") {
      style.color = toCSSColor(color);
    }
    if (typeof font === "string") {
      style.fontFamily = `"${getFontConfig(font).family}"`;
    }
    content = <span style={style}>{content}</span>;
  }
  return content;
}
