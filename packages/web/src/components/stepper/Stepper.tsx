import IncreaseIcon from "@/icons/increase.svg?jsx";
import DecreaseIcon from "@/icons/decrease.svg?jsx";
import styles from "./Stepper.module.css";
import type { JSX } from "@/jsx/jsx";
import type { Reactive } from "reactivity";

export interface StepperProps extends JSX.Attributes<"fieldset"> {
  id: string;
  label: string;
  value: Reactive<number>;
  min: number;
  max: number;
  step?: number;
  format?: Intl.NumberFormatOptions;
  onChange: (value: number) => void;
}

export default function Stepper({
  id,
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  format,
  ...props
}: StepperProps) {
  const formatter = new Intl.NumberFormat(undefined, format);

  function onClickIncrease() {
    const newValue = Math.min(value.value + step, max);
    onChange(newValue);
  }

  function onClickDecrease() {
    const newValue = Math.max(value.value - step, min);
    onChange(newValue);
  }

  return (
    <fieldset
      id={id}
      className={styles.fieldset}
      role="spinbutton"
      aria-label={label}
      aria-valuemin={min.toString()}
      aria-valuemax={max.toString()}
      aria-valuenow={value}
      data-tooltip-position="top"
      {...props}
    >
      <button
        type="button"
        name="decrease"
        className="floating"
        aria-label="Decrease"
        aria-controls={id}
        data-tooltip="Decrease"
        disabled={value.derive((v) => v <= min)}
        on:click={onClickDecrease}
      >
        <DecreaseIcon aria-hidden="true" />
      </button>
      <span>{value.derive((value) => formatter.format(value))}</span>
      <button
        type="button"
        name="increase"
        className="floating"
        aria-label="Increase"
        aria-controls={id}
        data-tooltip="Increase"
        disabled={value.derive((v) => v >= max)}
        on:click={onClickIncrease}
      >
        <IncreaseIcon aria-hidden="true" />
      </button>
    </fieldset>
  );
}
