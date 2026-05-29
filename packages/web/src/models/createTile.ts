import * as Y from "yjs";
import Section from "@/models/Section";
import Text from "@/models/Text";
import Image from "@/models/Image";
import Video from "@/models/Video";
import Link from "@/models/Link";
import PageLink from "@/models/PageLink";
import Table from "@/models/Table";
import Chart from "@/models/Chart";
import Tile from "@/models/Tile";
import type Page from "@/models/Page";
import type { TileType } from "api/types/tiles";

export default function createTile(page: Page, map: Y.Map<unknown>): Tile {
  const type = map.get("type") as TileType;

  switch (type) {
    case "SECTION":
      return new Section(page, map);
    case "TEXT":
      return new Text(page, map);
    case "IMAGE":
      return new Image(page, map);
    case "VIDEO":
      return new Video(page, map);
    case "LINK":
      return new Link(page, map);
    case "PAGE_LINK":
      return new PageLink(page, map);
    case "TABLE":
      return new Table(page, map);
    case "CHART":
      return new Chart(page, map);
    default:
      throw new Error(`Invalid tile type: ${type}`);
  }
}
