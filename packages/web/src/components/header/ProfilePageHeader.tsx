import { useCallback, useState } from "react";
import ResizingTextarea from "@/components/inputs/ResizingTextarea";
import useEditable from "@/hooks/useEditable";
import { classNames } from "@/utils/css";
import styles from "./ProfilePageHeader.module.css";
import editor from "@/editor";
import { handleError } from "@/utils/errors";

interface ProfilePageHeaderProps {
  name: string;
  imageUrl: string | null;
  subtitle: string | null;
}

function stripLineBreaks(value: string) {
  return value.replace(/\n/g, "");
}

export default function ProfilePageHeader({
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

  const commit = useCallback(async () => {
    try {
      await editor.setPageTitle(undefined, subtitleValue);
    } catch (error) {
      handleError(error);
    }
  }, [subtitleValue]);

  return (
    <header className={styles.header}>
      <profile-image class="large" src={imageUrl} name={name} />

      <div className={styles.text}>
        <h1>{name}</h1>

        <p className={classNames(styles.subtitle, "editable")}>
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
    </header>
  );
}
