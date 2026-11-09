import Stepper from "@/components/stepper/Stepper";
import styles from "./LineHeightPopover.module.css";
import type { Reactive } from "carillon";
import type { JSX } from "jsx/jsx";

export interface LineHeightPopoverProps extends Omit<
  JSX.Attributes<"anchored-popover">,
  "id" | "className"
> {
  id: string;
  value: Reactive<number>;
  onChange: (value: number) => void;
}

export default function LineHeightPopover({
  id,
  value,
  onChange,
  ...props
}: LineHeightPopoverProps) {
  return (
    <anchored-popover {...props} id={id} className={styles.popover}>
      <Stepper
        id={`${id}-stepper`}
        label="Line height"
        min={1}
        max={3}
        step={0.1}
        format={{
          style: "decimal",
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        }}
        value={value}
        onChange={onChange}
      />
    </anchored-popover>
  );
}
