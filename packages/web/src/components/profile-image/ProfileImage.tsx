import styles from "./ProfileImage.module.css";

interface ProfileImageProps {
  imageUrl: string | null;
  name: string;
  size?: "small" | "medium" | "large";
}

export default function ProfileImage({
  imageUrl,
  name,
  size = "small",
}: ProfileImageProps) {
  if (imageUrl) {
    return (
      <img
        classList={{ [styles.image]: true, [styles[size]]: true }}
        src={imageUrl}
        alt={name}
      />
    );
  }

  return (
    <span
      classList={{ [styles.initials]: true, [styles[size]]: true }}
      aria-hidden="true"
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}
