import ImageTile from "@/components/tiles/ImageTile";
import VideoTile from "@/components/tiles/VideoTile";
import TextTile from "@/components/tiles/TextTile";
import MapTile from "@/components/tiles/MapTile";
import LinkTile from "@/components/tiles/LinkTile";
import styles from "./Stack.module.css";
import type { ClientCollection } from "@/types/tiles";
import GridItem from "@/components/grid/GridItem";

interface StackProps {
  items: ClientCollection["items"];
}

function getTileComponent(item: ClientCollection["items"][number]) {
  const props = {
    id: item.id,
  };

  if (item.text) {
    return <TextTile {...props} columns={1} text={item.text} />;
  }

  if (item.image) {
    return <ImageTile {...props} image={item.image} movable={false} />;
  }

  if (item.video) {
    return <VideoTile {...props} video={item.video} />;
  }

  if (item.link) {
    return <LinkTile {...props} link={item.link} />;
  }

  if (item.map) {
    return <MapTile {...props} map={item.map} />;
  }

  return null;
}

export default function Stack({ items }: StackProps) {
  return (
    <stack-view class={styles.stack} expandable="expandable">
      {items.map((item, i) => (
        <GridItem
          className={styles.item}
          key={item.id}
          id={item.id}
          rows={1}
          columns={1}
          isEditable={false}
          onDelete={() => {}}
          grow={false}
          style={
            {
              "--index": i,
              "--angle": i === 0 ? 0 : `${((i * 123) % 20) - 10}deg`,
            } as React.CSSProperties
          }
        >
          {getTileComponent(item)}
        </GridItem>
      ))}
    </stack-view>
  );
}
