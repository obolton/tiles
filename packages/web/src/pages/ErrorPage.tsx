import CardLayout from "@/layouts/CardLayout";
import { withDestination } from "@/auth/destinations";
import styles from "./ErrorPage.module.css";

export type ErrorStatus = 403 | 404 | 500;

export interface ErrorPageProps {
  status: ErrorStatus;
  /** The requested path and query, offered as a retry link after a server error. */
  path: string;
  /** The requested path as a sign-in destination, if it is a valid one. */
  destination: string | null;
  signedIn: boolean;
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
    description:
      "This page doesn't exist, or it may have been deleted, unpublished or shared privately.",
  },
  500: {
    title: "Something went wrong",
    description: "Sorry, an unexpected error occurred. Please try again.",
  },
};

interface Action {
  label: string;
  href: string;
}

function getActions({ status, path, destination, signedIn }: ErrorPageProps): Action[] {
  const home: Action = { label: signedIn ? "Go to your library" : "Go home", href: "/" };

  if (status === 500) {
    return [{ label: "Try again", href: path }, home];
  }

  // Signing in may reveal a page that is hidden from signed-out visitors.
  if (!signedIn && destination) {
    return [{ label: "Sign in", href: withDestination("/sign-in", destination) }, home];
  }

  return [home];
}

export default function ErrorPage(props: ErrorPageProps) {
  const { status, details } = props;
  const { title, description } = ERROR_PAGE_CONTENT[status];

  return (
    <CardLayout eyebrow={String(status)} title={title} description={description}>
      <div className={styles.actions}>
        {getActions(props).map(({ label, href }, index) => (
          <a className={index === 0 ? "primary" : "secondary"} href={href}>
            {label}
          </a>
        ))}
      </div>

      {details ? <pre className={styles.details}>{details}</pre> : null}
    </CardLayout>
  );
}
