import ResizingTextarea from "@/components/inputs/ResizingTextarea";
import styles from "./ProfilePageHeader.module.css";
import { handleError } from "@/utils/errors";
import { setSearchParams } from "@/utils/urls";
import type { StoreInterface } from "@/utils/stores";
import type Editor from "@/editor/Editor";

interface ProfilePageHeaderProps {
  editor: Editor;
  name: string;
  imageUrl: string | null;
  subtitle: StoreInterface<string | null>;
}

function stripLineBreaks(value: string) {
  return value.replace(/\n/g, "");
}

export default function ProfilePageHeader({
  editor,
  name,
  imageUrl,
  subtitle,
}: ProfilePageHeaderProps) {
  const { isEditable } = editor;

  const commit = async (event: Event) => {
    const element = event.currentTarget as HTMLTextAreaElement;
    const value = stripLineBreaks(element.value);
    try {
      await editor.setPageTitle(undefined, value);
    } catch (error) {
      handleError(error);
    }
  };

  return (
    <header className={styles.header}>
      {imageUrl ? (
        <img
          className="profile-image large"
          src={setSearchParams(imageUrl, { class: "large" })}
          alt={name}
        />
      ) : null}

      <div className={styles.text}>
        <h1>{name}</h1>

        <p className={styles.subtitle}>
          {isEditable.derive((editable) =>
            editable ? (
              <ResizingTextarea
                id="page-subtitle-textarea"
                className={styles.editor}
                placeholder="Subtitle"
                rows={1}
                onchange={commit}
                value={subtitle.value ?? ""}
              />
            ) : (
              subtitle
            ),
          )}
        </p>
      </div>
    </header>
  );
}
