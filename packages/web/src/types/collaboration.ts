export interface User {
  id: string;
  name: string;
  imageUrl: string | null;
}

export interface PageAccess {
  user: User;
}

export interface Invite {
  id: string;
  /** The address the invite was sent to, or `null` for a link-only invite. */
  email: string | null;
  key: string;
  createdAt: string;
}
