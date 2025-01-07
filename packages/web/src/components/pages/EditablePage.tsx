import EditingToolbar from "@/components/menu/EditingToolbar";
import PageHeader from "@/components/header/PageHeader";
import Grid from "@/components/grid/Grid";
import type { AppRouterOutputs } from "@/api/client";

interface EditablePage {
  page: NonNullable<AppRouterOutputs["pages"]["getById"]>;
}

export default function EditablePage({ page }: EditablePage) {
  return (
    <>
      <EditingToolbar isPublished={page.published} />

      <PageHeader
        title={page.title}
        subtitle={page.subtitle}
        coverImageUrl={page.coverImageUrl}
        author={page.author}
        updatedAt={page.updatedAt}
      />

      <Grid tiles={page.tiles} />
    </>
  );
}
