import PageLayout from "@/layouts/PageLayout";
import { withDestination } from "@/auth/destinations";
import { SITE_NAME } from "@/constants/site";
import GoogleIcon from "@/icons/google.svg?jsx";
import ErrorIcon from "@/icons/error.svg?jsx";
import styles from "./SignIn.module.css";

export type SignInError = "cancelled" | "failed";

export interface SignInProps {
  destination: string | null;
  error: SignInError | null;
}

const ERROR_MESSAGES: Record<SignInError, string> = {
  cancelled: "Sign-in was cancelled. You can try again below.",
  failed: "Something went wrong while signing you in. Please try again.",
};

export default function SignIn({ destination, error }: SignInProps) {
  return (
    <PageLayout>
      <main className={styles.page}>
        <div className={styles.background} aria-hidden="true">
          <span />
          <span />
          <span />
        </div>

        <a className={styles.wordmark} href="/">
          {SITE_NAME}
        </a>

        <section className={styles.card} aria-labelledby="sign-in-heading">
          <h1 id="sign-in-heading">Sign in</h1>
          <p className={styles.description}>Use your Google account to continue.</p>

          {error ? (
            <div className={styles.alert} role="alert">
              <ErrorIcon aria-hidden="true" />
              {ERROR_MESSAGES[error]}
            </div>
          ) : null}

          <a className="primary" href={withDestination("/sign-in/google", destination)}>
            <GoogleIcon aria-hidden="true" />
            Continue with Google
          </a>

          {import.meta.env.DEV ? (
            <a
              className={styles["test-user"]}
              href={withDestination("/sign-in/test-user", destination)}
            >
              Sign in as a test user
            </a>
          ) : null}
        </section>
      </main>
    </PageLayout>
  );
}
