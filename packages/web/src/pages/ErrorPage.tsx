import CardLayout from "@/layouts/CardLayout";
import styles from "./ErrorPage.module.css";

export type ErrorStatus = 403 | 404 | 500;

export interface ErrorPageProps {
  status: ErrorStatus;
  /** Technical details of the error, shown in development only. */
  details?: string;
}

interface ErrorPageContent {
  title: string;
  description: string;
}

export const ERROR_PAGE_CONTENT: Record<ErrorStatus, ErrorPageContent> = {
  403: {
    title: "Access denied",
    description: "You don't have permission to view this page.",
  },
  404: {
    title: "Page not found",
    description: "This page doesn't exist or isn't available.",
  },
  500: {
    title: "Something went wrong",
    description: "Sorry, an unexpected error occurred. Please try again.",
  },
};

export default function ErrorPage({ status, details }: ErrorPageProps) {
  const { title, description } = ERROR_PAGE_CONTENT[status];

  return (
    <CardLayout eyebrow={String(status)} title={title} description={description}>
      <a className="primary" href="/">
        Home
      </a>

      {details ? <pre className={styles.details}>{details}</pre> : null}
    </CardLayout>
  );
}
