import Each from "@/jsx/each";
import { reactive } from "@/utils/reactivity";
import { highlight } from "@/utils/richText/code/highlight";
import styles from "./Code.module.css";
import type { CodeNode } from "@/utils/richText/types";

export interface CodeProps {
  node: CodeNode;
}

export default function Code({ node }: CodeProps) {
  const code = node.children.map((child) => child.text).join("");
  const spans = reactive<{ text: string; className: string | null }[]>([
    { text: code, className: null },
  ]);

  highlight(code, node.language).then((highlighted) => {
    spans.value = highlighted;
  });

  const lineCount = code.split("\n").length;

  return (
    <pre classList={{ [styles.numbered]: node.lineNumbers }}>
      {node.lineNumbers && (
        <div className={styles.gutter} aria-hidden="true">
          {Array.from({ length: lineCount }, (_, i) => (
            <div>{i + 1}</div>
          ))}
        </div>
      )}
      <code data-language={node.language}>
        {code.length > 0 ? (
          <Each items={spans}>
            {(span) =>
              span.className ? (
                <span className={span.className}>{span.text}</span>
              ) : (
                span.text
              )
            }
          </Each>
        ) : (
          <br />
        )}
      </code>
    </pre>
  );
}
