import TitleTab from "./TitleTab";
import PageTab from "./PageTab";
import StyleTab from "./StyleTab";
import type Page from "@/models/Page";

export interface PageToolbarProps {
  page: Page;
  allowDelete?: boolean;
}

export default function PageToolbar({ page, allowDelete }: PageToolbarProps) {
  return (
    <floating-toolbar
      className="primary"
      data-tooltip-position="bottom"
      aria-label="Page toolbar"
      name="page-toolbar"
    >
      <TitleTab page={page} />
      <PageTab page={page} allowDelete={allowDelete} />
      <StyleTab page={page} />
    </floating-toolbar>
  );
}
