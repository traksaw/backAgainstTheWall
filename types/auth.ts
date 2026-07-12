export interface User {
  _id: string;
  email: string;
  first_name: string;
  last_name: string;
  emailVerified: boolean;
}

export interface Profile {
  first_name: string;
  last_name: string;
}

export interface UserProfile {
  first_name: string;
  last_name: string;
}
