import ImageView from "@/components/images/ImageView";
import Tile from "@/components/tiles/Tile";
import type Image from "@/models/Image";

export interface ImageTileThumbnailProps {
  image: Image;
}

export default function ImageTileThumbnail({ image }: ImageTileThumbnailProps) {
  return (
    <Tile>
      <ImageView image={image} />
    </Tile>
  );
}
