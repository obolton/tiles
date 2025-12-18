import Each from "@/jsx/each";
import { reactive } from "@/utils/reactivity";
import { highlight } from "@/utils/richText/code/highlight";
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

  return (
    <pre>
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
