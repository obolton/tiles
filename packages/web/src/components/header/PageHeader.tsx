import { useCallback, useState } from "react";
import PlainTextEditor from "@/components/inputs/PlainTextEditor/PlainTextEditor";
import useEditable from "@/hooks/useEditable";
import client from "@/api/client";
import { classNames } from "@/utils/css";
import styles from "./PageHeader.module.css";

interface PageHeaderProps {
  pageId: string;
  title: string;
  subtitle: string | null;
}

export default function PageHeader({
  pageId,
  title: initialTitle,
  subtitle: initialSubtitle,
}: PageHeaderProps) {
  const [value, setValue] = useState(
    `${initialTitle}${initialSubtitle ? `\n${initialSubtitle}` : ""}`,
  );
  const isEditable = useEditable();

  const commit = useCallback(() => {
    const [title = "", ...otherLines] = value.split("\n");
    const subtitle = otherLines.join("\n").trim() || "";
    client.pages.update.mutate({
      id: pageId,
      title,
      subtitle,
    });
  }, [pageId, value]);

  const [title, ...subtitle] = value.split("\n");

  return (
    <div className={classNames(styles.header, "editable")}>
      {isEditable ? (
        <PlainTextEditor
          id="page-title-textarea"
          className={styles.editor}
          placeholder="Page title"
          onChange={setValue}
          onBlur={commit}
          value={value}
        />
      ) : (
        <>
          <h1>{title || "Page title"}</h1>
          {subtitle.map((line, index) => (
            <p key={index} className={styles.subtitle}>
              {line || <>&nbsp;</>}
            </p>
          ))}
        </>
      )}
    </div>
  );
}
