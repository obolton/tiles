import styles from "./ProfileImage.module.css";

interface ProfileImageProps {
  imageUrl: string | null;
  name: string;
}

export default function ProfileImage({ imageUrl, name }: ProfileImageProps) {
  if (imageUrl) {
    return <img className={styles.image} src={imageUrl} alt={name} />;
  }

  return (
    <span className={styles.initials} aria-hidden="true">
      {name.charAt(0).toUpperCase()}
    </span>
  );
}
