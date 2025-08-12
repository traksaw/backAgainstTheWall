// types/user.ts
export interface User {
  id: string;
  email: string;
  // Add other user properties as needed
}

export interface UserProfile {
  first_name: string;
  last_name: string;
  email?: string;
  // Add other profile properties as needed
}

// types/cast.ts
export interface CastMember {
  name: string;
  role: string;
  description: string;
  image: string;
  readMoreUrl?: string;
  order: number;
}

// types/modal.ts
export interface ModalState {
  showSignup: boolean;
  showSignin: boolean;
  showQuiz: boolean;
  showResults: boolean;
  showFilm: boolean;
  showQuizHistory: boolean;
}

// types/auth.ts
export interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isHydrated: boolean;
}