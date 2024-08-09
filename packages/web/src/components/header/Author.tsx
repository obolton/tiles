import styles from "./Author.module.css";

interface AuthorProps {
  id: string;
  name: string;
  imageUrl: string | null;
}

export default function Author({ id, name, imageUrl }: AuthorProps) {
  return (
    <address className={styles.author}>
      <profile-image src={imageUrl} name={name} />
      <a href={`/profiles/${id}`}>{name}</a>
    </address>
  );
}
