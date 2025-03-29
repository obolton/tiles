import { useCallback, useMemo, useState } from "react";
import PageHeaderEditor from "./PageHeaderEditor";
import useEditable from "@/hooks/useEditable";
import { classNames } from "@/utils/css";
import styles from "./PageHeader.module.css";
import { handleError } from "@/utils/errors";
import { showModal } from "@/utils/modals";
import ShareIcon from "@/icons/share.svg?jsx";
import BookmarkIcon from "@/icons/bookmark.svg?jsx";
import ImageIcon from "@/icons/image.svg?jsx";
import type { ImageModalResult } from "@/components/modals/image/ImageModal";
import { formatRelativeDate } from "@/utils/dates";
import { uploadMedia, preloadImage } from "@/utils/media";
import { viewTransition } from "@/utils/transitions";
import { useEditor } from "@/context/editor";

interface PageHeaderProps {
  title: string;
  subtitle: string | null;
  coverImageUrl: string | null;
  updatedAt: string | null;
  author: {
    id: string;
    username: string | null;
    name: string;
    imageUrl: string | null;
  } | null;
}

export default function PageHeader({
  title: initialTitle,
  subtitle: initialSubtitle,
  coverImageUrl: initialCoverImageUrl,
  author,
  updatedAt,
}: PageHeaderProps) {
  const editor = useEditor();
  const [title, setTitle] = useState(initialTitle);
  const [subtitle, setSubtitle] = useState(initialSubtitle);
  const [coverImageUrl, setCoverImageUrl] = useState(initialCoverImageUrl);
  const isEditable = useEditable();

  const onBlur = useCallback(
    async (newTitle: string, newSubtitle?: string) => {
      try {
        setTitle(newTitle);
        setSubtitle(newSubtitle || null);
        await editor.setPageTitle(newTitle, newSubtitle || "");
      } catch (error) {
        handleError(error);
      }
    },
    [editor],
  );

  const selectCoverImage = useCallback(
    () =>
      showModal<ImageModalResult>("IMAGE", {
        async onConfirm(result) {
          try {
            const imageKey = await uploadMedia(result.image, "image");
            const { coverImageUrl } = await editor.setCoverImage(imageKey);
            if (coverImageUrl) {
              await preloadImage(coverImageUrl);
            }
            viewTransition(() => setCoverImageUrl(coverImageUrl));
          } catch (error) {
            handleError(error);
          }
        },
      }),
    [editor],
  );

  const removeCoverImage = useCallback(async () => {
    try {
      await editor.setCoverImage(null);
      viewTransition(() => setCoverImageUrl(null));
    } catch (error) {
      handleError(error);
    }
  }, [editor]);

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
      {isEditable ? (
        <PageHeaderEditor
          className={styles.editor}
          title={title}
          subtitle={subtitle}
          onBlur={onBlur}
        />
      ) : (
        <div className={styles.title}>
          <h1>{title || "Page title"}</h1>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
      )}

      {author ? (
        <div className={styles.metadata}>
          <a
            href={`/profiles/${author.username ? `@${author.username}` : author.id}`}
          >
            <address>
              {author.imageUrl ? (
                <img
                  className="profile-image"
                  src={author.imageUrl}
                  alt={author.name}
                />
              ) : null}
              <span>{author.name}</span>
            </address>
          </a>

          {updatedAt ? (
            <time dateTime={updatedAt}>
              {formatRelativeDate(new Date(updatedAt))}
            </time>
          ) : null}

          <button
            id="share"
            className="floating xsmall"
            aria-label="Share"
            data-tooltip="Share this page"
          >
            <ShareIcon aria-hidden="true" />
          </button>

          <button
            id="bookmark"
            className="floating xsmall"
            aria-label="Bookmark"
            aria-pressed="false"
            data-tooltip="Bookmark this page"
          >
            <BookmarkIcon aria-hidden="true" />
          </button>

          {isEditable ? (
            <button
              className="floating xsmall"
              aria-label={
                coverImageUrl ? "Remove cover image" : "Add cover image"
              }
              data-tooltip={
                coverImageUrl ? "Remove cover image" : "Add a cover image"
              }
              type="button"
              aria-pressed={coverImageUrl ? "true" : "false"}
              onClick={coverImageUrl ? removeCoverImage : selectCoverImage}
            >
              <ImageIcon aria-hidden="true" />
            </button>
          ) : null}
        </div>
      ) : null}
    </header>
  );
}
