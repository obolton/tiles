import PageHeaderEditor from "./PageHeaderEditor";
import { classNames } from "@/utils/css";
import styles from "./PageHeader.module.css";
import { handleError } from "@/utils/errors";
import { showModal } from "@/utils/modals";
import ShareIcon from "@/icons/share.svg?jsx";
import BookmarkIcon from "@/icons/bookmark.svg?jsx";
import ImageIcon from "@/icons/image.svg?jsx";
import { formatRelativeDate } from "@/utils/dates";
import { uploadMedia, preloadImage } from "@/utils/media";
import { viewTransition } from "@/utils/transitions";
import type { ImageModalResult } from "@/components/modals/image/ImageModal";
import type Editor from "@/editor/Editor";
import type { Store } from "@/utils/stores";

interface PageHeaderProps {
  editor: Editor;
  isEditable: Store<boolean>;
  title: Store<string>;
  subtitle: Store<string | null>;
  coverImageUrl: Store<string | null>;
  updatedAt: string | null;
  author: {
    id: string;
    username: string | null;
    name: string;
    imageUrl: string | null;
  } | null;
}

export default function PageHeader({
  editor,
  isEditable,
  title,
  subtitle,
  coverImageUrl,
  author,
  updatedAt,
}: PageHeaderProps) {
  const onBlur = async (newTitle: string, newSubtitle?: string) => {
    try {
      await editor.setPageTitle(newTitle, newSubtitle || "");
    } catch (error) {
      handleError(error);
    }
  };

  const toggleCoverImage = async () => {
    if (coverImageUrl.value) {
      try {
        await editor.setCoverImage(null);
        viewTransition(() => {
          coverImageUrl.value = null;
        });
      } catch (error) {
        handleError(error);
      }
    } else {
      showModal<ImageModalResult>("IMAGE", {
        async onConfirm(result) {
          try {
            const imageKey = await uploadMedia(result.image, "image");
            const { coverImageUrl: url } = await editor.setCoverImage(imageKey);
            if (url) {
              await preloadImage(url);
            }
            viewTransition(() => {
              coverImageUrl.value = url;
            });
          } catch (error) {
            handleError(error);
          }
        },
      });
    }
  };

  const style = {
    backgroundImage: coverImageUrl ? `url(${coverImageUrl})` : undefined,
  };

  return (
    <header
      className={coverImageUrl.derive((url) =>
        classNames(styles.header, url ? styles["with-cover-image"] : null),
      )}
      style={style}
    >
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

          {isEditable.derive((editable) =>
            editable ? (
              <button
                className="floating xsmall"
                aria-label={coverImageUrl.derive((url) =>
                  url ? "Remove cover image" : "Add cover image",
                )}
                data-tooltip={coverImageUrl.derive((url) =>
                  url ? "Remove cover image" : "Add a cover image",
                )}
                type="button"
                aria-pressed={coverImageUrl.derive((url) =>
                  url ? "true" : "false",
                )}
                onclick={toggleCoverImage}
              >
                <ImageIcon aria-hidden="true" />
              </button>
            ) : null,
          )}
        </div>
      ) : null}

      {isEditable.derive((editable) =>
        editable ? (
          <PageHeaderEditor
            className={styles.editor}
            title={title}
            subtitle={subtitle}
            onBlur={onBlur}
          />
        ) : (
          <div className={styles.title}>
            <h1>{title}</h1>
            {subtitle.derive((value) => (value ? <p>{value}</p> : null))}
          </div>
        ),
      )}
    </header>
  );
}
