import Section from "@/components/layouts/section/Section";
import ImageTile from "@/components/tiles/ImageTile";
import VideoTile from "@/components/tiles/VideoTile";
import TextTile from "@/components/tiles/TextTile";
import LinkTile from "@/components/tiles/LinkTile";
import PageLinkTile from "@/components/tiles/PageLinkTile";
import TableTile from "@/components/tiles/TableTile";
import ChartTile from "@/components/tiles/ChartTile";
import SectionModel from "@/models/Section";
import TextModel from "@/models/Text";
import ImageModel from "@/models/Image";
import VideoModel from "@/models/Video";
import LinkModel from "@/models/Link";
import PageLinkModel from "@/models/PageLink";
import TableModel from "@/models/Table";
import ChartModel from "@/models/Chart";
import type Tile from "@/models/Tile";

export interface TileContentProps {
  tile: Tile;
}

export default function TileContent({ tile }: TileContentProps) {
  const showToolbar = tile.editor.selection.derive(
    (selection) => selection.has(tile.id) && selection.size === 1,
  );

  if (tile instanceof SectionModel) {
    return <Section section={tile} showToolbar={showToolbar} />;
  }
  if (tile instanceof ImageModel) {
    return <ImageTile image={tile} showToolbar={showToolbar} />;
  }
  if (tile instanceof VideoModel) {
    return <VideoTile video={tile} />;
  }
  if (tile instanceof TextModel) {
    return <TextTile text={tile} showToolbar={showToolbar} />;
  }
  if (tile instanceof LinkModel) {
    return <LinkTile link={tile} showToolbar={showToolbar} />;
  }
  if (tile instanceof PageLinkModel) {
    return <PageLinkTile pageLink={tile} showToolbar={showToolbar} />;
  }
  if (tile instanceof TableModel) {
    return <TableTile table={tile} showToolbar={showToolbar} />;
  }
  if (tile instanceof ChartModel) {
    return <ChartTile chart={tile} showToolbar={showToolbar} />;
  }

  throw new Error(`Unknown tile type: ${tile.type}`);
}
