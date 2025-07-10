import { IApiResponse } from './api.types';

export interface IUser {
  id: number;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  lastApiCallAt?: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string | null;
  country?: string | null;
  state?: string | null;
  role: string;
  status?: 'active' | 'inactive' | string;
  isEmailVerified?: boolean;
  otp?: number;
  otpExpireAt?: string;
  avatar: string | null;
  emailVerifiedAt?: string;
  // Login-specific fields
  fullName?: string;
  isActive?: boolean;
}

export interface ITokenData {
  token: string;
  refreshToken: string;
  expiresIn: number;
}

export interface ILoginData {
  user: IUser;
  token: ITokenData;
}

// Using the global API response interface
export type ILoginResponse = IApiResponse<ILoginData>;

