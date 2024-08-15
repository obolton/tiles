import { formatRelativeDate } from "@/utils/dates";
import styles from "./PageMetadata.module.css";

interface PageMetadata {
  id: string;
  name: string;
  imageUrl: string | null;
  updatedAt: string;
}

export default function PageMetadata({
  id,
  name,
  imageUrl,
  updatedAt,
}: PageMetadata) {
  return (
    <div className={styles.metadata}>
      <a href={`/profiles/${id}`}>
        <address>
          <profile-image src={imageUrl} name={name} />
          <span>{name}</span>
        </address>
      </a>
      <time dateTime={updatedAt}>
        {formatRelativeDate(new Date(updatedAt))}
      </time>
    </div>
  );
}
