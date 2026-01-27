import type { ClientImageTile } from "api/types/tiles";
import type { Operation } from "./base";

export interface ImageUpdateData {
  tileId: string;
  changes: Partial<Pick<ClientImageTile, "text" | "originX" | "originY">>;
}

export interface ImageUpdateOperation extends Operation<
  "image.update",
  ImageUpdateData
> {}

export type ImageOperation = ImageUpdateOperation;
