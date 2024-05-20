import { useCallback, useState } from "react";
import useEditable from "../../hooks/useEditable";
import client from "../../api/client";
import "./PageTitle.module.css";

interface PageTitleProps {
  pageId: string;
  title: string;
}

export default function PageTitle({ pageId, title }: PageTitleProps) {
  const [value, setValue] = useState(title);
  const isEditable = useEditable();

  const commit = useCallback(
    () => client.pages.update.mutate({ id: pageId, title: value }),
    [value]
  );

  return (
    <h1 className="editable">
      {isEditable ? (
        <input
          id="page-title"
          type="text"
          placeholder="Page title"
          onChange={(event) => setValue(event.target.value)}
          onBlur={commit}
          value={value}
        />
      ) : (
        value
      )}
    </h1>
  );
}
