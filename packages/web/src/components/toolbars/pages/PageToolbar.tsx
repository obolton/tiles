import PageTab from "./PageTab";
import type Page from "@/models/Page";

export interface PageToolbarProps {
  page: Page;
  showAlignment?: boolean;
}

export default function PageToolbar({ page, showAlignment }: PageToolbarProps) {
  return (
    <floating-toolbar
      className="primary"
      data-tooltip-position="bottom"
      aria-label="Page toolbar"
      name="page-toolbar"
    >
      <PageTab page={page} showAlignment={showAlignment} />
    </floating-toolbar>
  );
}
