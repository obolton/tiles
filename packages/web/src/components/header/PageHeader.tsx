import { useCallback, useState } from "react";
import ResizingTextarea from "@/components/inputs/ResizingTextarea";
import useEditable from "@/hooks/useEditable";
import client from "@/api/client";
import styles from "./PageHeader.module.css";

interface PageHeaderProps {
  pageId: string;
  title: string;
  subtitle: string | null;
}

function stripLineBreaks(value: string) {
  return value.replace(/\n/g, "");
}

export default function PageHeader({
  pageId,
  title,
  subtitle,
}: PageHeaderProps) {
  const [titleValue, setTitleValue] = useState(title);
  const [subtitleValue, setSubtitleValue] = useState(subtitle ?? "");
  const isEditable = useEditable();

  const changeTitle = useCallback(
    (event: React.FormEvent<HTMLTextAreaElement>) =>
      setTitleValue(stripLineBreaks(event.currentTarget.value)),
    [],
  );

  const changeSubtitle = useCallback(
    (event: React.FormEvent<HTMLTextAreaElement>) =>
      setSubtitleValue(stripLineBreaks(event.currentTarget.value)),
    [],
  );

  const commit = useCallback(
    () =>
      client.pages.update.mutate({
        id: pageId,
        title: titleValue,
        subtitle: subtitleValue,
      }),
    [pageId, titleValue, subtitleValue],
  );

  return (
    <div className={`${styles.header} editable`}>
      <h1>
        {isEditable ? (
          <ResizingTextarea
            id="page-title-textarea"
            placeholder="Page title"
            rows={1}
            onChange={changeTitle}
            onBlur={commit}
            value={titleValue}
          />
        ) : (
          titleValue
        )}
      </h1>
      <p className={styles.subtitle}>
        {isEditable ? (
          <ResizingTextarea
            id="page-subtitle-textarea"
            placeholder="Subtitle"
            rows={1}
            onChange={changeSubtitle}
            onBlur={commit}
            value={subtitleValue}
          />
        ) : (
          subtitleValue
        )}
      </p>
    </div>
  );
}
