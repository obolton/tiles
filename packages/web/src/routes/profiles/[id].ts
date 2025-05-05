import client from "@/api/client";
import { getSessionId } from "@/utils/sessions";
import { getFontConfig } from "@/utils/fonts";
import ProfilePage, { type ProfilePageProps } from "@/pages/ProfilePage";
import type {
  Route,
  RequestProperties,
  RouteLoaderResult,
  RouteMetadata,
} from "@/router/router";

// TODO: Add cache headers
async function loader({
  headers,
  parameters,
}: RequestProperties): RouteLoaderResult<ProfilePageProps> {
  const sessionId = getSessionId(headers);

  const id = parameters.id;

  if (!id) {
    throw new Error("Not Found");
  }

  const username = id.startsWith("@") ? id.slice(1) : null;

  const user = await client.pages.getProfilePage.query(
    username ? { username } : { userId: id },
    { context: { sessionId } },
  );

  if (!user) {
    throw new Error("Not Found");
  }

  const theme = user.profilePage.theme;
  const hue = user.profilePage.hue;
  const font = user.profilePage.font
    ? getFontConfig(user.profilePage.font)
    : undefined;

  return {
    title: user.name,
    bodyAttributes: {
      "data-page-id": user.profilePage.id,
      className:
        theme === "LIGHT" ? "light" : theme === "DARK" ? "dark" : "color",
      style: {
        "--page-hue":
          theme === "COLOR" && typeof hue === "number"
            ? `${hue.toFixed(2)}deg`
            : undefined,
        "--font": font ? `"${font.family}", "${font.fallback}"` : undefined,
      },
    },
    data: { user },
  };
}

const metadata = {
  scripts: [{ src: "/src/init" }],
} satisfies RouteMetadata;

export default {
  loader: import.meta.env.SSR ? loader : undefined,
  component: ProfilePage,
  metadata,
} satisfies Route<ProfilePageProps>;
