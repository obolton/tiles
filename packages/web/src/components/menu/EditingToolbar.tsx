import EditingTools from "./EditingTools";
import ShareIcon from "@/icons/share.svg?jsx";
import BookmarkIcon from "@/icons/bookmark.svg?jsx";
import "./EditingToolbar.module.css";

interface EditingToolbarProps {
  isPublished: boolean;
  allowDelete?: boolean;
  allowPublish?: boolean;
}

export default function EditingToolbar({
  isPublished,
  allowDelete = true,
  allowPublish = true,
}: EditingToolbarProps) {
  return (
    <div
      id="editing-toolbar"
      className="toolbar secondary"
      role="toolbar"
      aria-label="Editing toolbar"
      data-tooltip-position="left"
    >
      <label id="edit-label">
        Edit
        <input id="edit-switch" type="checkbox" role="switch" />
      </label>

      <button
        id="share"
        className="floating"
        aria-label="Share"
        data-tooltip="Share this page"
      >
        <ShareIcon aria-hidden="true" />
      </button>

      <button
        id="bookmark"
        className="floating"
        aria-label="Bookmark"
        aria-pressed="false"
        data-tooltip="Bookmark this page"
      >
        <BookmarkIcon aria-hidden="true" />
      </button>

      <EditingTools
        isPublished={isPublished}
        allowPublish={allowPublish}
        allowDelete={allowDelete}
      />
    </div>
  );
}
