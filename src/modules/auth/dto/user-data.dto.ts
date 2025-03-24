export interface UserData {
  id: string;
  email: string;
  name: string;
  password: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  profile?: {
    id: string;
    avatar?: string;
    phone?: string;
    address?: string;
  };
  authTokens?: {
    id: string;
    token: string;
    expiresAt: Date;
  }[];
  roles: { name: string }[];
  permissions: { name: string }[];
}
