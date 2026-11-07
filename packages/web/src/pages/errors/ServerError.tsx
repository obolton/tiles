import CardLayout from "@/layouts/CardLayout";
import styles from "./ServerError.module.css";
import type { ErrorPageProps } from "@/utils/errorPages";

function getDetails(error: Error) {
  const cause = error.cause ?? error;
  if (cause instanceof Error) {
    return cause.stack ?? `${cause.name}: ${cause.message}`;
  }
  return typeof cause === "string" ? cause : undefined;
}

export default function ServerError({ error }: ErrorPageProps) {
  const details = import.meta.env.DEV ? getDetails(error) : undefined;

  return (
    <CardLayout
      title="Something went wrong"
      description="Sorry, an unexpected error occurred. Please try again."
    >
      <a className="primary" href="/">
        Home
      </a>

      {details ? (
        <pre className={styles.details} tabindex={0}>
          {details}
        </pre>
      ) : null}
    </CardLayout>
  );
}
