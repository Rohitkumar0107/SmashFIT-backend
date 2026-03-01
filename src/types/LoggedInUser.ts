export interface LoggedInUser {
  id: string;
  email: string;
  role: string;
  full_name?: string;
  avatar_url?: string;
}
