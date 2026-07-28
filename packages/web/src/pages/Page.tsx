import type { Doc } from "yjs";
import PageLayout from "@/layouts/PageLayout";
import EditablePage from "@/components/pages/EditablePage";
import HeaderActions from "@/components/menu/HeaderActions";
import PageTitle from "@/components/menu/PageTitle";
import Editor from "@/editor/Editor";
import { isSignedIn } from "@/utils/sessions";
import type { AppRouterOutputs } from "@/api/client";
import type { VersionEntry } from "@/components/versions/VersionHistory";

type PageData = NonNullable<AppRouterOutputs["pages"]["getById"]>;

export interface PageProps {
  page: PageData;
  doc: Doc;
  version?: VersionEntry;
}

export default function Page({ page, doc, version }: PageProps) {
  const editor = Editor.init(page, doc, version);
  const showActions = !import.meta.env.SSR && isSignedIn();

  return (
    <PageLayout
      workspaceId={page.workspaceId}
      center={<PageTitle page={editor.page} isEditable={editor.isEditable} version={version} />}
      actions={showActions ? <HeaderActions editor={editor} /> : null}
    >
      <EditablePage editor={editor} />
    </PageLayout>
  );
}
