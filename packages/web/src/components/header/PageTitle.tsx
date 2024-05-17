import { useState } from "react";
import useEditable from "../../hooks/useEditable";
import "./PageTitle.module.css";

interface PageTitleProps {
  pageId: string;
  title: string;
}

export default function PageTitle({ pageId, title }: PageTitleProps) {
  const [value, setValue] = useState(title);
  const isEditable = useEditable();

  return (
    <h1 className="editable">
      {isEditable ? (
        <input
          id="page-title"
          type="text"
          placeholder="Page title"
          onChange={(event) => setValue(event.target.value)}
          value={value}
        />
      ) : (
        value
      )}
    </h1>
  );
}
