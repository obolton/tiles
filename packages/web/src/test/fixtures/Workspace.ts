import type { AppRouterOutputs } from "@/api/client";

export const WORKSPACE: AppRouterOutputs["workspaces"]["get"] = {
  id: "workspace-id",
  name: "Test Workspace",
  role: "ADMIN",
};
