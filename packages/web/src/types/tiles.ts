import type { ClientCollection } from "api/types/tiles";
import type { ReactiveRecord, ComputedReactive } from "@/utils/reactivity";
import type Text from "@/items/Text";
import type Image from "@/items/Image";
import type Video from "@/items/Video";
import type Link from "@/items/Link";
import type PageLink from "@/items/PageLink";
import type Map from "@/items/Map";
import type Table from "@/items/Table";
import type Chart from "@/items/Chart";

export type Tile = Text | Image | Video | Link | PageLink | Map | Table | Chart;

export type Section = Pick<ClientCollection, "id"> &
  ReactiveRecord<Omit<ClientCollection, "id">>;

export interface SectionWithTiles extends Section {
  tiles: ComputedReactive<Tile[]>;
}

export type Layout = SectionWithTiles[];
