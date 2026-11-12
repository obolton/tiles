import NewPageMenuItems from "@/components/menu/NewPageMenuItems";
import NewIcon from "@/icons/new.svg?jsx";

export interface NewPageButtonProps {
  workspaceId: string;
}

export default function NewPageButton({ workspaceId }: NewPageButtonProps) {
  return (
    <>
      <button type="button" className="primary" popovertarget="new-page-menu" aria-haspopup="menu">
        <NewIcon aria-hidden="true" />
        New page
      </button>
      <popover-menu id="new-page-menu">
        <NewPageMenuItems workspaceId={workspaceId} />
      </popover-menu>
    </>
  );
}
