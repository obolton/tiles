import PageLayout from "@/layouts/PageLayout";
import SidebarLayout from "@/layouts/SidebarLayout";
import Sidebar from "./Sidebar";
import client from "@/api/client";
import { setSearchParams } from "@/utils/urls";
import { showToast } from "@/utils/toasts";
import { handleError } from "@/utils/errors";
import { uploadMedia } from "@/utils/media";
import { user as userProperties } from "@/utils/sessions";
import styles from "./Profile.module.css";
import type { AppRouterOutputs } from "@/api/client";
import type FilePicker from "@/elements/file-picker/FilePicker";

type User = NonNullable<AppRouterOutputs["users"]["getUserInfo"]>;

export interface ProfileProps {
  workspaceId: string;
  user: User;
  isAdmin: boolean;
}

const ACCEPT_CONTENT_TYPES = ["image/jpeg", "image/png"];

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
    userProperties.value = userInfo;
    showToast("Your settings were saved.", "success");
  } catch (error) {
    form.dataset.error = "true";
    handleError(error);
  } finally {
    delete form.dataset.pending;
  }
}

export default function Profile({ workspaceId, user, isAdmin }: ProfileProps) {
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
      const imageKey = await uploadMedia({
        file,
        purpose: "profile",
        workspaceId,
      });
      const userInfo = await client.users.update.mutate({ imageKey });
      userProperties.value = userInfo;
      image.src = setSearchParams(userInfo.imageUrl!, { class: "large" })!;
      URL.revokeObjectURL(url);
    } catch (error) {
      handleError(error);
    }
  }

  return (
    <PageLayout
      workspaceId={user.workspaces[0]?.id}
      user={user}
      center={<h1>Settings</h1>}
    >
      <SidebarLayout
        sidebar={
          <Sidebar workspaceId={workspaceId} page="PROFILE" isAdmin={isAdmin} />
        }
      >
        <form class="vertical" on:submit={onSubmit}>
          <file-picker
            className={styles.file}
            accept={ACCEPT_CONTENT_TYPES.join(",")}
            on:change={onChangeProfileImage}
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
              maxlength={64}
            />
          </label>

          <label>
            Username
            <input
              type="text"
              name="username"
              value={user.username ?? ""}
              placeholder="Username"
              minlength={2}
              maxlength={30}
              pattern="[a-zA-Z0-9\-]{2,30}"
              on:change={onChangeUsername}
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
              maxlength={254}
            />
          </label>

          <footer>
            <button className="primary" type="submit">
              Save
            </button>
          </footer>
        </form>
      </SidebarLayout>
    </PageLayout>
  );
}
