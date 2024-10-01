import { classNames } from "@/utils/css";

interface IconProps {
  className?: string;
  src: string;
}

export default function Icon({ className, src }: IconProps) {
  return <img className={classNames("icon", className)} src={src} alt="" />;
}
