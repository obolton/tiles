import type { ClientCollection } from "api/types/tiles";
import type { ReactiveRecord, ComputedReactive } from "@/utils/reactivity";
import type Text from "@/models/Text";
import type Image from "@/models/Image";
import type Video from "@/models/Video";
import type Link from "@/models/Link";
import type PageLink from "@/models/PageLink";
import type Map from "@/models/Map";
import type Table from "@/models/Table";
import type Chart from "@/models/Chart";

export type Tile = Text | Image | Video | Link | PageLink | Map | Table | Chart;

export type Section = Pick<ClientCollection, "id"> &
  ReactiveRecord<Omit<ClientCollection, "id">>;

export interface SectionWithTiles extends Section {
  tiles: ComputedReactive<Tile[]>;
}

export type Layout = SectionWithTiles[];
