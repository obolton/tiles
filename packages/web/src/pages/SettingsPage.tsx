import PageLayout from "@/layouts/PageLayout";
import client from "@/api/client";
import { setSearchParams } from "@/utils/urls";
import { redirectWithToast } from "@/utils/toasts";
import { handleError } from "@/utils/errors";
import { uploadMedia } from "@/utils/media";
import { user } from "@/utils/sessions";
import styles from "./SettingsPage.module.css";
import type { AppRouterOutputs } from "@/api/client";
import type FilePicker from "@/elements/filePicker/FilePicker";

type User = NonNullable<AppRouterOutputs["auth"]["getUserInfo"]>;

export interface SettingsPageProps {
  user: User;
}

const ACCEPT_CONTENT_TYPES = ["image/jpeg", "image/png"];

async function onChangeProfileImage(event: Event) {
  const filePicker = event.currentTarget as FilePicker;
  const image = filePicker.firstElementChild as HTMLImageElement;

  try {
    const file = filePicker.file;
    if (!file) {
      return;
    }
    const url = URL.createObjectURL(file);
    image.src = url;
    const imageKey = await uploadMedia(file, "profile-image");
    const userInfo = await client.users.update.mutate({ imageKey });
    user.value = userInfo;
    image.src = setSearchParams(userInfo.imageUrl!, { class: "large" })!;
    URL.revokeObjectURL(url);
  } catch (error) {
    handleError(error);
  }
}

async function onChangeUsername(event: Event) {
  const username = event.currentTarget as HTMLInputElement;

  const value = username.value;
  const validity = username.validity;

  if (validity.tooShort) {
    username.setCustomValidity("Usernames must be at least 2 characters.");
  } else if (validity.tooLong) {
    username.setCustomValidity("Usernames must be no more than 30 characters.");
  } else if (validity.patternMismatch) {
    username.setCustomValidity(
      "Usernames can contain only letters, numbers and dashes.",
    );
  } else if (validity.valid && value.length > 0) {
    const isAvailable = await client.users.isUsernameAvailable.query({
      username: value,
    });
    username.setCustomValidity(
      isAvailable ? "" : "This username is already taken.",
    );
  } else {
    username.setCustomValidity("");
  }
  username.reportValidity();
}

async function onSubmit(event: SubmitEvent) {
  const form = event.currentTarget as HTMLFormElement;
  event.preventDefault();

  form.dataset.pending = "true";
  delete form.dataset.error;

  try {
    const formData = new FormData(form);
    const userInfo = await client.users.update.mutate({
      name: (formData.get("name") as string | null) ?? "",
      username: (formData.get("username") as string | null) || null,
      email: (formData.get("email") as string | null) ?? "",
    });
    user.value = userInfo;
    redirectWithToast(
      userInfo.username
        ? `/profiles/@${userInfo.username}`
        : `/profiles/${userInfo.id}`,
      "Your settings were saved.",
      "success",
    );
  } catch (error) {
    delete form.dataset.pending;
    form.dataset.error = "true";
    handleError(error);
  }
}

export default function SettingsPage({ user }: SettingsPageProps) {
  return (
    <PageLayout>
      <header>
        <h1>Settings</h1>
      </header>

      <main>
        <form class="vertical" onsubmit={onSubmit}>
          <file-picker
            className={styles.file}
            accept={ACCEPT_CONTENT_TYPES.join(",")}
            onchange={onChangeProfileImage}
          >
            <img
              className="profile-image large"
              src={setSearchParams(user.imageUrl!, { class: "large" })}
              alt={user.name}
              data-tooltip="Select a new profile image"
              data-tooltip-position="right"
            />
          </file-picker>

          <label>
            Name
            <input
              type="text"
              name="name"
              value={user.name}
              placeholder="Name"
              required
              maxlength="64"
            />
          </label>

          <label>
            Username
            <input
              type="text"
              name="username"
              value={user.username ?? ""}
              placeholder="Username"
              minlength="2"
              maxlength="30"
              pattern="[a-zA-Z0-9\-]{2,30}"
              onchange={onChangeUsername}
            />
          </label>

          <label>
            Email address
            <input
              type="email"
              name="email"
              value={user.email}
              placeholder="Email address"
              required
              maxlength="254"
            />
          </label>

          <footer>
            <button className="primary" type="submit">
              Save
            </button>
          </footer>
        </form>
      </main>
    </PageLayout>
  );
}
