import ColorPicker from "@/components/colors/ColorPicker";
import TrashIcon from "@/icons/trash.svg?jsx";
import styles from "./DropdownOption.module.css";
import type { Color } from "@/utils/color";
import type { Reactive } from "@/utils/reactivity";

export interface DropdownOption {
  value: Reactive<string>;
  color: Reactive<Color | null>;
}

export interface DropdownOptionRowProps {
  option: DropdownOption;
  onDelete: (item: DropdownOption) => void;
}

export default function DropdownOptionRow({
  option,
  onDelete,
}: DropdownOptionRowProps) {
  return (
    <li className={styles.option}>
      <input
        type="text"
        name="option"
        value={option.value}
        placeholder="Option"
        required
      />
      <ColorPicker
        id={`${option.value}-color`}
        value={option.color}
        onChange={(value) => {
          option.color.value = value;
        }}
      />
      <button
        type="button"
        className="floating"
        on:click={() => onDelete(option)}
      >
        <TrashIcon aria-hidden="true" />
      </button>
    </li>
  );
}
