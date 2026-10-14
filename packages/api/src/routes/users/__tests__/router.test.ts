import { vi } from "vitest";
import { getUserInfo, updateUser, isUsernameAvailable } from "@/routes/users/users";
import { describeRouter } from "@/test/procedures";

vi.mock("@/routes/users/users");

describeRouter("users", {
  getUserInfo: {
    guard: "authenticated",
    handler: getUserInfo,
    input: undefined,
    args: (_, ctx) => [ctx],
  },
  update: {
    guard: "authenticated",
    handler: updateUser,
    input: { name: "Alice" },
    invalid: { name: "" },
  },
  isUsernameAvailable: {
    guard: "authenticated",
    handler: isUsernameAvailable,
    input: { username: "alice" },
    invalid: { username: "a" },
  },
});
