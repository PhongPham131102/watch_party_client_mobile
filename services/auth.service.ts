import { ApiResponse } from "../types";
import { apiClient } from "./api.service";
import {
  GetMeReponse,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  ForgotPasswordRequest,
  VerifyResetCodeRequest,
  ResetPasswordRequest,
} from "../types/auth.types";

export class AuthService {
  async register(data: RegisterRequest): Promise<RegisterResponse> {
    try {
      const response = await apiClient.post<RegisterResponse>(
        "/auth/register",
        data
      );
      return response;
    } catch (error) {
      throw error as ApiResponse;
    }
  }
  async login(data: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await apiClient.post<LoginResponse>("/auth/login", data);
      return response;
    } catch (error) {
      throw error as ApiResponse;
    }
  }
  async getMe(): Promise<GetMeReponse> {
    try {
      const response = await apiClient.get<GetMeReponse>("/auth/me");
      return response;
    } catch (error) {
      throw error as ApiResponse;
    }
  }

  async logout(): Promise<ApiResponse> {
    try {
      const response = await apiClient.post<ApiResponse>("/auth/logout");
      return response;
    } catch (error) {
      throw error as ApiResponse;
    }
  }

  async changePassword(data: any): Promise<ApiResponse> {
    try {
      const response = await apiClient.post<ApiResponse>(
        "/auth/change-password",
        data
      );
      return response;
    } catch (error) {
      throw error as ApiResponse;
    }
  }

  async forgotPassword(data: ForgotPasswordRequest): Promise<ApiResponse> {
    try {
      const response = await apiClient.post<ApiResponse>(
        "/auth/forgot-password",
        data
      );
      return response;
    } catch (error) {
      throw error as ApiResponse;
    }
  }

  async verifyResetCode(data: VerifyResetCodeRequest): Promise<ApiResponse> {
    try {
      const response = await apiClient.post<ApiResponse>(
        "/auth/verify-reset-code",
        data
      );
      return response;
    } catch (error) {
      throw error as ApiResponse;
    }
  }

  async resetPassword(data: ResetPasswordRequest): Promise<ApiResponse> {
    try {
      const response = await apiClient.post<ApiResponse>(
        "/auth/reset-password",
        data
      );
      return response;
    } catch (error) {
      throw error as ApiResponse;
    }
  }
}

export const authService = new AuthService();
