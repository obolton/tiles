import styles from "./Icon.module.css";

interface IconProps {
  src: string;
}

export default function Icon({ src }: IconProps) {
  return <img className={styles.icon} src={src} alt="" />;
}
