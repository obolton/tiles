import Stepper from "@/components/stepper/Stepper";
import styles from "./TextSizePopover.module.css";
import type { Reactive } from "reactivity";
import type { JSX } from "@/jsx/jsx";

export interface TextSizePopoverProps extends Omit<
  JSX.Attributes<"anchored-popover">,
  "id" | "className"
> {
  id: string;
  value: Reactive<number>;
  onChange: (value: number) => void;
}

export default function TextSizePopover({ id, value, onChange, ...props }: TextSizePopoverProps) {
  return (
    <anchored-popover {...props} id={id} className={styles.popover}>
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
    </anchored-popover>
  );
}
