export interface User {
  id: string;
  full_name: string;
  email: string;
  role: "ADMIN" | "UMPIRE" | "USER";
  picture?: string;
}

export interface UmpireResponse {
  id: string;
  full_name: string;
  email: string;
  initials: string;
}
