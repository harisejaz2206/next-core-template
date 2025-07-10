export interface IUser {
  id: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  lastApiCallAt: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string | null;
  country: string | null;
  state: string | null;
  role: 'admin' | 'consultant' | 'vet' | string;
  status: 'active' | 'inactive' | string;
  isEmailVerified: boolean;
  otp: number;
  otpExpireAt: string;
  avatar: string | null;
  emailVerifiedAt: string;
}

export interface AuthState {
  user: IUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
} 