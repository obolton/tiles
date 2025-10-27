import TileTools from "@/components/toolbars/tiles/TileTools";
import ToolbarButton from "@/components/buttons/ToolbarButton";
import LinkIcon from "@/icons/link.svg?jsx";
import { showModal } from "@/utils/modals";
import Link from "@/models/Link";
import type PageLink from "@/models/PageLink";

const LinkModalLoader = () => import("@/components/modals/LinkModal");

export interface LinkToolbarProps {
  link: Link | PageLink;
}

export default function LinkToolbar({ link }: LinkToolbarProps) {
  const editLink = () => {
    if (!(link instanceof Link)) {
      return;
    }
    showModal(LinkModalLoader, {
      props: {
        workspaceId: link.editor.workspaceId,
        url: link.url.value,
        showPages: false,
      },
      async onConfirm(result) {
        if (result && "url" in result && result.url) {
          await link.setUrl(result.url);
        }
      },
    });
  };

  return (
    <floating-toolbar
      className="primary"
      aria-label="Link toolbar"
      data-tooltip-position="top"
    >
      <ul role="group" aria-label="Layout">
        <li role="presentation">
          <ToolbarButton label="Edit link" on:click={editLink}>
            <LinkIcon aria-hidden="true" />
          </ToolbarButton>
        </li>
      </ul>

      <TileTools tile={link} />
    </floating-toolbar>
  );
}
