import DocumentPage from "./DocumentPage";
import PresentationPage from "./PresentationPage";
import LayoutPage from "./LayoutPage";
import type Page from "@/models/Page";
import type TileCollection from "@/models/TileCollection";
import type { Reactive } from "carillon";
import type { JSX } from "jsx/jsx";

export interface PageContentsProps {
  page: Page;
  isEditable: Reactive<boolean>;
  /** Whether the page's own toolbar is shown: editing with nothing selected. */
  showToolbar: Reactive<boolean>;
  tiles: TileCollection;
  signal?: AbortSignal;
  end?: Reactive<JSX.Node>;
  bar?: JSX.Node;
}

export default function PageContents(props: PageContentsProps) {
  switch (props.page.type) {
    case "DOCUMENT":
      return <DocumentPage {...props} />;
    case "PRESENTATION":
      return <PresentationPage {...props} />;
    case "LAYOUT":
      return <LayoutPage {...props} />;
  }
}
