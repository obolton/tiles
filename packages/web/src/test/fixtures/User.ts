import type { User } from "@/utils/sessions";

export const USER: User = {
  id: "user-id",
  username: "test",
  name: "Test User",
  email: "test@example.com",
  imageKey: null,
  imageUrl: "https://tiles.dev",
  workspaces: [{ id: "workspace-id", name: "Test Workspace" }],
};
