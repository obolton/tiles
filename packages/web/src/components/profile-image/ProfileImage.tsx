import styles from "./ProfileImage.module.css";

interface ProfileImageProps {
  imageUrl: string | null;
  name: string;
  size?: "small" | "medium" | "large";
  color?: string;
}

export default function ProfileImage({ imageUrl, name, size = "small", color }: ProfileImageProps) {
  if (imageUrl) {
    return (
      <img
        classList={{
          [styles.image]: true,
          [styles[size]]: true,
          [styles.border]: !!color,
        }}
        style={color ? { "--border-color": color } : undefined}
        src={imageUrl}
        alt={name}
      />
    );
  }

  return (
    <span
      classList={{
        [styles.initials]: true,
        [styles[size]]: true,
        [styles.border]: !!color,
      }}
      style={color ? { "--border-color": color } : undefined}
      aria-hidden="true"
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}
