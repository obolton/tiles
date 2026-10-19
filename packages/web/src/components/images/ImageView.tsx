import RichText from "@/components/text/RichText";
import { flag } from "reactivity";
import { getImageSrcSet, getImageStyle } from "./imageStyle";
import styles from "./ImageView.module.css";
import type Image from "@/models/Image";

export interface ImageViewProps {
  image: Image;
  showInLightbox?: boolean;
}

export default function ImageView({ image, showInLightbox }: ImageViewProps) {
  const { id, imageUrl, text, alt } = image;

  if (!imageUrl) {
    return (
      <div classList={{ [styles.deleted]: true }}>
        <p>This image has been deleted.</p>
      </div>
    );
  }

  const srcSet = getImageSrcSet(imageUrl);
  const style = getImageStyle(image);
  const loaded = flag(false);

  return (
    <figure
      id={showInLightbox ? `${id}-figure` : undefined}
      classList={{
        [styles.figure]: true,
        [styles.auto]: image.sizing.derive((s) => s === "AUTO"),
        [styles.loading]: loaded.derive((v) => !v),
      }}
      data-show-in-lightbox={showInLightbox ? "true" : undefined}
    >
      <img
        src={imageUrl}
        srcset={srcSet}
        loading="lazy"
        alt={alt}
        style={style}
        on:load={loaded.on.bind(loaded)}
      />

      {text.derive((value) =>
        value ? (
          <figcaption classList={{ "rich-text": true, [styles.caption]: true }}>
            <RichText content={value} />
          </figcaption>
        ) : null,
      )}
    </figure>
  );
}
