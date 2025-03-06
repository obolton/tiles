export interface PageInvite {
  id: string;
  email: string;
}

export interface User {
  id: string;
  name: string;
  imageUrl: string | null;
}

export interface PageAccess {
  user: User;
}
