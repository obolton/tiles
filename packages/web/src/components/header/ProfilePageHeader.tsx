import { useCallback, useState } from "react";
import ResizingTextarea from "@/components/inputs/ResizingTextarea";
import useEditable from "@/hooks/useEditable";
import client from "@/api/client";
import styles from "./ProfilePageHeader.module.css";

interface ProfilePageHeaderProps {
  pageId: string;
  name: string;
  imageUrl: string | null;
  subtitle: string | null;
}

function stripLineBreaks(value: string) {
  return value.replace(/\n/g, "");
}

export default function ProfilePageHeader({
  pageId,
  name,
  imageUrl,
  subtitle,
}: ProfilePageHeaderProps) {
  const [subtitleValue, setSubtitleValue] = useState(subtitle ?? "");
  const isEditable = useEditable();

  const changeSubtitle = useCallback(
    (event: React.FormEvent<HTMLTextAreaElement>) =>
      setSubtitleValue(stripLineBreaks(event.currentTarget.value)),
    [],
  );

  const commit = useCallback(
    () =>
      client.pages.update.mutate({
        id: pageId,
        subtitle: subtitleValue,
      }),
    [pageId, subtitleValue],
  );

  return (
    <div className={styles.header}>
      <profile-image class="large" src={imageUrl} name={name} />

      <div className={styles.text}>
        <h1>{name}</h1>

        <p className={`${styles.subtitle} editable`}>
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
    </div>
  );
}
