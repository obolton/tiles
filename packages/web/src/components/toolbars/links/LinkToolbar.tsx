import StyleTab from "@/components/toolbars/tiles/StyleTab";
import DateTab from "@/components/toolbars/tiles/DateTab";
import ToolbarGroup from "@/components/toolbars/ToolbarGroup";
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
    void showModal(LinkModalLoader, {
      props: {
        workspaceId: link.editor.workspaceId,
        url: link.url.value,
        showPages: false,
      },
      async onConfirm(result) {
        if ("url" in result && result.url) {
          await link.setUrl(result.url);
        }
      },
    });
  };

  return (
    <floating-toolbar className="primary" aria-label="Link toolbar" data-tooltip-position="bottom">
      <toolbar-tab name="link" label="Link">
        <ToolbarGroup label="Link tools">
          <ToolbarButton on:click={editLink}>
            <LinkIcon aria-hidden="true" />
            Edit link
          </ToolbarButton>
        </ToolbarGroup>
      </toolbar-tab>

      <StyleTab tile={link} />

      <DateTab tile={link} />
    </floating-toolbar>
  );
}
