import PageLayout from "@/layouts/PageLayout";
import "@/styles/authentication.css";

export interface SignInProps {
  destination: string | null;
}

export default function SignIn({ destination }: SignInProps) {
  const params = destination ? `?destination=${encodeURIComponent(destination)}` : "";
  return (
    <PageLayout>
      <main className="card">
        <h2>Sign in</h2>
        <p>Select an option below to sign in.</p>
        <a className="primary" href={`/sign-in/google${params}`}>
          Sign in with Google
        </a>
      </main>
    </PageLayout>
  );
}
