import DocumentPage from "./DocumentPage";
import PresentationPage from "./PresentationPage";
import CollectionPage from "./CollectionPage";
import FreePage from "./FreePage";
import type Page from "@/models/Page";
import type TileCollection from "@/models/TileCollection";
import type { Reactive } from "reactivity";
import type { JSX } from "@/jsx/jsx";

export interface PageContentsProps {
  page: Page;
  isEditable: Reactive<boolean>;
  tiles: TileCollection;
  signal?: AbortSignal;
  end?: JSX.Node;
  endVisible?: Reactive<boolean>;
}

export default function PageContents(props: PageContentsProps) {
  switch (props.page.type) {
    case "DOCUMENT":
      return <DocumentPage {...props} />;
    case "PRESENTATION":
      return <PresentationPage {...props} />;
    case "COLLECTION":
      return <CollectionPage {...props} />;
    case "FREE":
      return <FreePage {...props} />;
  }
}
