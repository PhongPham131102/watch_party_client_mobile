/* eslint-disable @typescript-eslint/no-empty-object-type */
import { Role } from "./role.types";
import { UserProfile } from "./profile.types";
import { ApiResponse, BaseEntity } from "./api.types";

export interface FormLoginErrors {
  username?: string;
  password?: string;
}
export interface RegisterRequest {
  email: string;
  password: string;
  username: string;
  fullName: string;
}

export interface User extends BaseEntity {
  email: string;
  username: string;
  isActive: boolean;
  role: Role;
  profile: UserProfile;
}

export interface RegisterResponse extends ApiResponse {
  data: {
    user: User;
    accessToken: string;
    refreshToken: string;
  };
}

export interface LoginRequest {
  username: string;
  password: string;
}
export interface LoginResponse extends RegisterResponse {}

export interface GetMeReponse extends ApiResponse {
  data: {
    user: User;
  };
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface VerifyResetCodeRequest {
  email: string;
  code: string;
}

export interface ResetPasswordRequest {
  email: string;
  code: string;
  newPassword: string;
  confirmPassword: string;
}
