import styles from "./Author.module.css";

interface AuthorProps {
  id: string;
  name: string;
  imageUrl: string;
}

export default function Author({ id, name, imageUrl }: AuthorProps) {
  return (
    <address className={styles.author}>
      <img src={imageUrl} alt={name} />
      <a href={`/profiles/${id}`}>{name}</a>
    </address>
  );
}
