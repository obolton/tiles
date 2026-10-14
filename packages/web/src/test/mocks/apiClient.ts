import { vi, type Mock } from "vitest";

interface MockQuery {
  query: Mock;
}

interface MockMutation {
  mutate: Mock;
}

function query(): MockQuery {
  return { query: vi.fn() };
}

function mutation(): MockMutation {
  return { mutate: vi.fn() };
}

// Covers the procedures called by route loaders. Use with:
// vi.mock("@/api/client", () => import("@/test/mocks/apiClient"));
export default {
  users: {
    getUserInfo: query(),
  },
  workspaces: {
    get: query(),
    listInvites: query(),
    listUsers: query(),
    acceptInvite: mutation(),
  },
  folders: {
    get: query(),
    list: query(),
    listPages: query(),
  },
  pages: {
    getById: query(),
    list: query(),
    listShared: query(),
    listDeleted: query(),
  },
  bookmarks: {
    list: query(),
  },
  collaboration: {
    acceptPageInvite: mutation(),
  },
  auth: {
    signIn: mutation(),
  },
};
