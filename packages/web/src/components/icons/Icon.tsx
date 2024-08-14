import styles from "./Icon.module.css";

interface IconProps {
  className?: string;
  src: string;
}

export default function Icon({ className, src }: IconProps) {
  return <img className={`${styles.icon} ${className}`} src={src} alt="" />;
}
