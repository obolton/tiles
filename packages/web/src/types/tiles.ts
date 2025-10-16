import type {
  ClientChartTile,
  ClientCollection,
  ClientImageTile,
  ClientLinkTile,
  ClientMapTile,
  ClientPageLinkTile,
  ClientTableTile,
  ClientTextTile,
  ClientTile,
  ClientVideoTile,
  TileType,
  ChartSeries,
  ClientPlace,
} from "api/src/types/tiles.ts";
import type {
  Reactive,
  ReactiveRecord,
  ComputedReactive,
} from "@/utils/reactivity";
import type { EditorState } from "prosemirror-state";

export type {
  ClientTextTile,
  ClientImageTile,
  ClientVideoTile,
  ClientLinkTile,
  ClientMapTile,
  ClientCollection,
  ClientPageLinkTile,
  ClientTile,
  TileType,
  ChartSeries,
  ClientPlace,
};

export type ReactiveTile<
  T extends ClientTile = ClientTile,
  P extends keyof T = never,
> = T extends ClientTile
  ? ReactiveRecord<T, "id" | "placementId" | "type" | P>
  : never;

export type TextProperties = ReactiveTile<ClientTextTile> & {
  state: Reactive<EditorState | null>;
};
export type ImageProperties = ReactiveTile<ClientImageTile> & {
  state: Reactive<EditorState | null>;
};
export type LinkProperties = ReactiveTile<ClientLinkTile>;
export type MapProperties = ReactiveTile<ClientMapTile>;
export type PageLinkProperties = ReactiveTile<ClientPageLinkTile>;
export type TableProperties = ReactiveTile<ClientTableTile>;
export type VideoProperties = ReactiveTile<ClientVideoTile>;
export type ChartSeriesProperties = ReactiveRecord<ChartSeries, "id">;
export type ChartProperties = Omit<ReactiveTile<ClientChartTile>, "series"> & {
  series: Reactive<ChartSeriesProperties[]>;
};

export type Tile =
  | ImageProperties
  | LinkProperties
  | MapProperties
  | PageLinkProperties
  | TableProperties
  | TextProperties
  | VideoProperties
  | ChartProperties;

export type Section = Pick<ClientCollection, "id"> &
  ReactiveRecord<Omit<ClientCollection, "id">>;

export interface SectionWithTiles extends Section {
  tiles: ComputedReactive<Tile[]>;
}

export type Layout = SectionWithTiles[];
