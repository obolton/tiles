import { useCallback } from "react";
import Icon from "@/components/icons/Icon";
import deleteIcon from "@/icons/delete.svg";
import styles from "./DeleteButton.module.css";
import { classNames } from "@/utils/css";

interface DeleteButtonProps {
  className?: string;
  onPress: (event: React.MouseEvent) => void;
}

export default function DeleteButton({
  className,
  onPress,
}: DeleteButtonProps) {
  const onPointerDown = useCallback((event: React.PointerEvent) => {
    event.stopPropagation();
    event.preventDefault();
  }, []);

  return (
    <button
      className={classNames(styles.button, className)}
      aria-label="Delete"
      type="button"
      onClick={onPress}
      onPointerDownCapture={onPointerDown}
    >
      <Icon src={deleteIcon.src} />
    </button>
  );
}
