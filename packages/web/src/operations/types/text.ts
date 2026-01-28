import type { ClientTextTile } from "api/types/tiles";
import type { Operation } from "./base";

export interface TextUpdateData {
  tileId: string;
  changes: Partial<Pick<ClientTextTile, "content" | "align">>;
}

export interface TextUpdateOperation extends Operation<
  "text.update",
  TextUpdateData
> {}

export type TextOperation = TextUpdateOperation;
