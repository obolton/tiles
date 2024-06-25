import { useCallback, useState } from "react";
import ResizingTextarea from "@/components/inputs/ResizingTextarea";
import useEditable from "@/hooks/useEditable";
import client from "@/api/client";
import styles from "./PageTitle.module.css";

interface PageTitleProps {
  pageId: string;
  title: string;
}

export default function PageTitle({ pageId, title }: PageTitleProps) {
  const [value, setValue] = useState(title);
  const isEditable = useEditable();

  const change = useCallback(
    (event: React.FormEvent<HTMLTextAreaElement>) =>
      setValue(event.currentTarget.value.replace(/\n/g, "")),
    [],
  );

  const commit = useCallback(
    () => client.pages.update.mutate({ id: pageId, title: value }),
    [pageId, value],
  );

  return (
    <h1 className={`${styles.pageTitle} editable`}>
      {isEditable ? (
        <ResizingTextarea
          id="page-title-textarea"
          placeholder="Page title"
          rows={1}
          onChange={change}
          onBlur={commit}
          value={value}
        />
      ) : (
        value
      )}
    </h1>
  );
}
