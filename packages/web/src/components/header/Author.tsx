import styles from "./Author.module.css";

interface AuthorProps {
  id: string;
  name: string;
  imageUrl: string | null;
}

export default function Author({ id, name, imageUrl }: AuthorProps) {
  return (
    <address className={styles.author}>
      {imageUrl ? (
        <img className="profile" src={imageUrl} alt={name} />
      ) : (
        <div className="profile-image-placeholder">{name.charAt(0)}</div>
      )}
      <a href={`/profiles/${id}`}>{name}</a>
    </address>
  );
}
