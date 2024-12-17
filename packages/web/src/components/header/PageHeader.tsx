import { useCallback, useMemo, useState } from "react";
import PlainTextEditor from "@/components/inputs/PlainTextEditor/PlainTextEditor";
import useEditable from "@/hooks/useEditable";
import client from "@/api/client";
import { classNames } from "@/utils/css";
import styles from "./PageHeader.module.css";
import { handleError } from "@/utils/errors";
import { showModal } from "@/utils/modals";
import Icon from "@/components/icons/Icon";
import imageIcon from "@/icons/image.svg";
import type { ImageModalResult } from "@/components/modals/ImageModal";
import { formatRelativeDate } from "@/utils/dates";

interface PageHeaderProps {
  pageId: string;
  title: string;
  subtitle: string | null;
  coverImageUrl: string | null;
  updatedAt: string | null;
  author: {
    id: string;
    name: string;
    imageUrl: string | null;
  } | null;
}

export default function PageHeader({
  pageId,
  title: initialTitle,
  subtitle: initialSubtitle,
  coverImageUrl: initialCoverImageUrl,
  author,
  updatedAt,
}: PageHeaderProps) {
  const [value, setValue] = useState(
    `${initialTitle}${initialSubtitle ? `\n${initialSubtitle}` : ""}`,
  );
  const [coverImageUrl, setCoverImageUrl] = useState(initialCoverImageUrl);
  const isEditable = useEditable();

  const commit = useCallback(async () => {
    const [title = "", ...otherLines] = value.split("\n");
    const subtitle = otherLines.join("\n").trim() || "";
    if (!title) {
      return;
    }
    try {
      await client.pages.update.mutate({
        id: pageId,
        title,
        subtitle,
      });
    } catch (error) {
      handleError(error);
    }
  }, [pageId, value]);

  const selectCoverImage = useCallback(async () => {
    const result = await showModal<ImageModalResult>("IMAGE");
    if (!result) {
      return;
    }
    try {
      const page = await client.pages.update.mutate({
        id: pageId,
        coverImageKey: result.imageKey,
      });
      setCoverImageUrl(page.coverImageUrl);
    } catch (error) {
      handleError(error);
    }
  }, [pageId]);

  const removeCoverImage = useCallback(async () => {
    try {
      await client.pages.update.mutate({
        id: pageId,
        coverImageKey: null,
      });
      setCoverImageUrl(null);
    } catch (error) {
      handleError(error);
    }
  }, [pageId]);

  const [title, ...subtitle] = value.split("\n");

  const style = useMemo(
    () => ({
      backgroundImage: coverImageUrl ? `url(${coverImageUrl})` : undefined,
    }),
    [coverImageUrl],
  );

  return (
    <header
      className={classNames(
        styles.header,
        coverImageUrl ? styles["with-cover-image"] : null,
      )}
      style={style}
    >
      <div className={styles.title}>
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

      {author ? (
        <div className={styles.metadata}>
          <a href={`/profiles/${author.id}`}>
            <address>
              <profile-image src={author.imageUrl} name={author.name} />
              <span>{author.name}</span>
            </address>
          </a>
          {updatedAt ? (
            <time dateTime={updatedAt}>
              {formatRelativeDate(new Date(updatedAt))}
            </time>
          ) : null}
        </div>
      ) : null}

      {isEditable ? (
        <div className={styles.buttons}>
          <button
            className="floating tooltip-bottom"
            aria-label={
              coverImageUrl ? "Remove cover image" : "Add a cover image"
            }
            type="button"
            aria-pressed={coverImageUrl ? "true" : "false"}
            onClick={coverImageUrl ? removeCoverImage : selectCoverImage}
          >
            <Icon src={imageIcon.src} />
          </button>
        </div>
      ) : null}
    </header>
  );
}
