import Prompt, { type PromptProps } from "./Prompt";
import styles from "./InlinePrompt.module.css";

export default function InlinePrompt(props: PromptProps) {
  return (
    <div className={styles.container}>
      <Prompt {...props} className={styles.prompt} />
    </div>
  );
}
