import { getPathDestination, withDestination } from "@/auth/destinations";
import { isSignedIn } from "@/utils/sessions";

export default function SignIn() {
  if (import.meta.env.SSR || isSignedIn()) {
    return null;
  }

  const href = withDestination("/sign-in", getPathDestination(location.pathname));

  return (
    <floating-toolbar aria-label="Sign in toolbar" data-tooltip-position="top">
      <ul role="group">
        <li role="presentation">
          <a id="sign-in" className="primary" href={href}>
            Sign in
          </a>
        </li>
      </ul>
    </floating-toolbar>
  );
}
