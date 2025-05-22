import PageLayout from "@/layouts/PageLayout";
import EditablePage from "@/components/pages/EditablePage";
import type { AppRouterOutputs } from "@/api/client";

type PageData = NonNullable<AppRouterOutputs["pages"]["getById"]>;

export interface PageProps {
  page: PageData;
}

export default function Page({ page }: PageProps) {
  return (
    <PageLayout showBookmark showTableOfContents>
      <EditablePage page={page} />
    </PageLayout>
  );
}
