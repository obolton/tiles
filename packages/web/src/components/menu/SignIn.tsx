import { isSignedIn } from "@/utils/sessions";

export default function SignIn() {
  if (import.meta.env.SSR || isSignedIn()) {
    return null;
  }

  return (
    <floating-toolbar aria-label="Sign in toolbar" data-tooltip-position="top">
      <ul role="group">
        <li role="presentation">
          <a id="sign-in" className="primary" href="/sign-in/google">
            Sign in
          </a>
        </li>
      </ul>
    </floating-toolbar>
  );
}
