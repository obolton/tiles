import Tile from "@/components/tiles/Tile";
import TextView from "@/components/text/TextView";
import type Text from "@/models/Text";

export interface TextTileThumbnailProps {
  text: Text;
}

export default function TextTileThumbnail({ text }: TextTileThumbnailProps) {
  return (
    <Tile>
      <TextView text={text} />
    </Tile>
  );
}
