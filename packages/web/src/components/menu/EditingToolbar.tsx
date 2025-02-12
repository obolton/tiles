import EditingTools from "./EditingTools";
import shareIcon from "@/icons/share.svg";
import bookmarkIcon from "@/icons/bookmark.svg";
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
        <img className="icon" src={shareIcon.src} alt="Share" />
      </button>

      <button
        id="bookmark"
        className="floating"
        aria-label="Bookmark"
        aria-pressed="false"
        data-tooltip="Bookmark this page"
      >
        <img className="icon" src={bookmarkIcon.src} alt="Bookmark" />
      </button>

      <EditingTools
        isPublished={isPublished}
        allowPublish={allowPublish}
        allowDelete={allowDelete}
      />
    </div>
  );
}
