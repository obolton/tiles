import styles from "./ProfileImage.module.css";
import type { JSX } from "jsx/jsx";

interface ProfileImageProps extends Pick<JSX.Attributes<"span">, "classList"> {
  imageUrl: string | null;
  name: string;
  size?: "small" | "medium" | "large" | "xlarge";
  color?: string;
}

export default function ProfileImage({
  imageUrl,
  name,
  size = "small",
  color,
  classList,
}: ProfileImageProps) {
  if (imageUrl) {
    return (
      <img
        classList={{
          [styles.image]: true,
          [styles[size]]: true,
          [styles.border]: !!color,
          ...classList,
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
        ...classList,
      }}
      style={color ? { "--border-color": color } : undefined}
      aria-hidden="true"
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}
