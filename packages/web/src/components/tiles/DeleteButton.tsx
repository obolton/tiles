import { useCallback } from "react";
import Icon from "@/components/icons/Icon";
import deleteIcon from "@/icons/delete.svg";
import styles from "./DeleteButton.module.css";

interface DeleteButtonProps {
  onPress: (event: React.MouseEvent) => void;
}

export default function DeleteButton({ onPress }: DeleteButtonProps) {
  const onPointerDown = useCallback((event: React.PointerEvent) => {
    event.stopPropagation();
    event.preventDefault();
  }, []);

  return (
    <button
      className={styles.button}
      type="button"
      onClick={onPress}
      onPointerDownCapture={onPointerDown}
    >
      <Icon src={deleteIcon.src} />
    </button>
  );
}
