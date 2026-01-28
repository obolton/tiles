import CloseIcon from "@/icons/close.svg?jsx";
import { scrollIntoViewIfNeeded } from "@/utils/scroll";
import styles from "./Chip.module.css";
import type { JSX } from "@/jsx/jsx";

export interface ChipProps {
  icon: JSX.Component<JSX.Attributes<"svg">>;
  label: string;
  href?: string;
  onRemove?: () => void;
}

function handleLinkClick(event: MouseEvent) {
  const anchor = event.currentTarget as HTMLAnchorElement;
  if (!anchor.href) {
    return;
  }
  event.preventDefault();
  const target = document.querySelector(anchor.href);
  if (target instanceof HTMLElement) {
    scrollIntoViewIfNeeded(target, { behavior: "smooth" });
  }
}

export default function Chip({ icon: Icon, label, href, onRemove }: ChipProps) {
  return (
    <div className={styles.chip}>
      <a className={styles.link} href={href} on:click={handleLinkClick}>
        <Icon className={styles.icon} aria-hidden="true" />
        <span className={styles.label}>{label}</span>
      </a>
      {onRemove && (
        <button
          className={styles.remove}
          on:click={onRemove}
          type="button"
          aria-label="Remove"
        >
          <CloseIcon aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
