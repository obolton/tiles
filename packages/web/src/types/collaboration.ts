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
  email: string;
  createdAt: string;
}
