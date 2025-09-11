import Stepper from "@/components/stepper/Stepper";
import styles from "./TextSizePopover.module.css";
import type { Reactive } from "@/utils/reactivity";
import type { JSX } from "@/jsx/jsx";
import type PopoverMenu from "@/elements/menu/PopoverMenu";

export interface TextSizePopoverProps
  extends Omit<JSX.Attributes<PopoverMenu>, "id" | "className"> {
  id: string;
  value: Reactive<number>;
  onChange: (value: number) => void;
}

export default function TextSizePopover({
  id,
  value,
  onChange,
  ...props
}: TextSizePopoverProps) {
  return (
    <popover-menu {...props} id={id} className={styles.popover}>
      <Stepper
        id={`${id}-stepper`}
        label="Text size"
        min={0.5}
        max={2.5}
        step={0.25}
        format={{ style: "percent" }}
        value={value}
        onChange={onChange}
      />
    </popover-menu>
  );
}
