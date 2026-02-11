import Section from "@/models/Section";
import Text from "@/models/Text";
import Image from "@/models/Image";
import Video from "@/models/Video";
import Link from "@/models/Link";
import PageLink from "@/models/PageLink";
import MapObject from "@/models/Map";
import Table from "@/models/Table";
import Chart from "@/models/Chart";
import Tile from "@/models/Tile";
import type Page from "@/models/Page";
import type { ClientTile } from "api/types/tiles";

export default function createTile(page: Page, properties: ClientTile): Tile {
  const type = properties.type;
  switch (type) {
    case "SECTION":
      return new Section(page, properties);
    case "TEXT":
      return new Text(page, properties);
    case "IMAGE":
      return new Image(page, properties);
    case "VIDEO":
      return new Video(page, properties);
    case "LINK":
      return new Link(page, properties);
    case "PAGE_LINK":
      return new PageLink(page, properties);
    case "MAP":
      return new MapObject(page, properties);
    case "TABLE":
      return new Table(page, properties);
    case "CHART":
      return new Chart(page, properties);
    default:
      throw new Error(`Invalid tile type: ${type}`);
  }
}
