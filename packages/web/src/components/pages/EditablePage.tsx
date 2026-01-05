import EditingToolbar from "@/components/menu/EditingToolbar";
import PageContents from "@/components/pages/PageContents";
import DockZone from "@/components/docks/DockZone";
import Editor from "@/editor/Editor";
import InsertButton from "@/components/buttons/InsertButton";
import SelectionToolbar from "@/components/toolbars/selection/SelectionToolbar";
import If from "@/jsx/if";
import { isSignedIn } from "@/utils/sessions";
import { handleError } from "@/utils/errors";
import styles from "./EditablePage.module.css";
import type { AppRouterOutputs } from "@/api/client";

if (!import.meta.env.SSR) {
  import("@/elements/editor").catch(handleError);
}

export interface EditablePageProps {
  page: NonNullable<AppRouterOutputs["pages"]["getById"]>;
}

function setDockSizeProperty(name: string, size: number | null) {
  if (size !== null) {
    document.body.style.setProperty(name, `${size}px`);
  } else {
    document.body.style.removeProperty(name);
  }
}

export default function EditablePage({ page }: EditablePageProps) {
  const editor = Editor.init(page);
  const { isEditable, selection, tiles, dockedTiles, dockSizes } = editor;
  const showToolbar = !import.meta.env.SSR && isSignedIn();

  if (!import.meta.env.SSR) {
    dockSizes.subscribe(() => {
      const sizes = dockSizes.value;
      setDockSizeProperty("--dock-top-size", sizes.TOP);
      setDockSizeProperty("--dock-bottom-size", sizes.BOTTOM);
      setDockSizeProperty("--dock-left-size", sizes.LEFT);
      setDockSizeProperty("--dock-right-size", sizes.RIGHT);
    });
  }

  return (
    <>
      <div className={styles["page-layout"]}>
      <DockZone editor={editor} edge="TOP" tiles={dockedTiles.TOP} />
      <DockZone editor={editor} edge="LEFT" tiles={dockedTiles.LEFT} />
      <PageContents editor={editor} tiles={tiles} />
      <DockZone editor={editor} edge="RIGHT" tiles={dockedTiles.RIGHT} />
      <DockZone editor={editor} edge="BOTTOM" tiles={dockedTiles.BOTTOM} />
      </div>

      {showToolbar ? <EditingToolbar editor={editor} /> : null}

      <If condition={selection.derive((value) => value.size >= 2)}>
        <SelectionToolbar />
      </If>

      <If condition={isEditable}>
        <InsertButton id="insert-button" />
      </If>
    </>
  );
}
