import SectionModel from "@/models/Section";
import TextModel from "@/models/Text";
import ImageModel from "@/models/Image";
import VideoModel from "@/models/Video";
import LinkModel from "@/models/Link";
import PageLinkModel from "@/models/PageLink";
import TableModel from "@/models/Table";
import ChartModel from "@/models/Chart";
import LinkTileThumbnail from "@/components/tiles/LinkTileThumbnail";
import PageLinkTileThumbnail from "@/components/tiles/PageLinkTileThumbnail";
import SectionThumbnail from "@/components/layouts/section/SectionThumbnail";
import TextTileThumbnail from "@/components/tiles/TextTileThumbnail";
import ImageTileThumbnail from "@/components/tiles/ImageTileThumbnail";
import TableTileThumbnail from "@/components/tiles/TableTileThumbnail";
import VideoTileThumbnail from "@/components/tiles/VideoTileThumbnail";
import ChartTileThumbnail from "@/components/tiles/ChartTileThumbnail";
import type Tile from "@/models/Tile";
import type { JSX } from "@/jsx/jsx";

export default function getTileThumbnail(tile: Tile): JSX.Node {
  if (tile instanceof SectionModel) {
    return <SectionThumbnail section={tile} />;
  }
  if (tile instanceof TextModel) {
    return <TextTileThumbnail text={tile} />;
  }
  if (tile instanceof ImageModel) {
    return <ImageTileThumbnail image={tile} />;
  }
  if (tile instanceof TableModel) {
    return <TableTileThumbnail table={tile} />;
  }
  if (tile instanceof VideoModel) {
    return <VideoTileThumbnail video={tile} />;
  }
  if (tile instanceof ChartModel) {
    return <ChartTileThumbnail chart={tile} />;
  }
  if (tile instanceof LinkModel) {
    return <LinkTileThumbnail link={tile} />;
  }
  if (tile instanceof PageLinkModel) {
    return <PageLinkTileThumbnail pageLink={tile} />;
  }
  throw new Error(`Unknown tile type: ${tile.type}`);
}
