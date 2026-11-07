import CardLayout from "@/layouts/CardLayout";
import { withDestination } from "@/auth/destinations";
import GoogleIcon from "@/icons/google.svg?jsx";
import ErrorIcon from "@/icons/error.svg?jsx";
import styles from "./SignIn.module.css";
import type { SignInError } from "@/auth/oauth2";

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
    <CardLayout title="Sign in" description="Use your Google account to continue.">
      {error ? (
        <p className={styles.alert} role="alert">
          <ErrorIcon aria-hidden="true" />
          {ERROR_MESSAGES[error]}
        </p>
      ) : null}

      <a className="secondary" href={withDestination("/sign-in/google", destination)}>
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
    </CardLayout>
  );
}
