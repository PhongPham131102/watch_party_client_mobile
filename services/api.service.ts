/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, { AxiosError, AxiosInstance } from "axios";
import { ApiResponse } from "../types";
import { API_BASE_URL } from "../constants/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DeviceEventEmitter } from "react-native";

export class ApiClient {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 30000,
      withCredentials: true,
    });

    // Request interceptor
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        // Add auth token
        const token = await AsyncStorage.getItem("accessToken");
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        if (config.method?.toLowerCase() === "get") {
          const params = (config.params || {}) as Record<string, unknown>;
          if (!params.t) {
            (params as any).t = Date.now();
            config.params = params;
          }
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response) => response.data,
      (error: AxiosError) => {
        const status = error?.response?.status;

        if (status === 401) {
          DeviceEventEmitter.emit("unauthorized");
        }

        throw (error.response?.data as ApiResponse) || error;
      }
    );
  }

  async get<T>(
    endpoint: string,
    params?: Record<string, any>,
    config?: any
  ): Promise<T> {
    return this.axiosInstance.get<T>(endpoint, {
      params,
      ...config,
    }) as Promise<T>;
  }

  async post<T>(endpoint: string, data?: any, config?: any): Promise<T> {
    return this.axiosInstance.post<T>(endpoint, data, config) as Promise<T>;
  }

  async put<T>(endpoint: string, data?: any, config?: any): Promise<T> {
    return this.axiosInstance.put<T>(endpoint, data, config) as Promise<T>;
  }

  async delete<T>(
    endpoint: string,
    params?: Record<string, any>,
    config?: any
  ): Promise<T> {
    return this.axiosInstance.delete<T>(endpoint, {
      params,
      ...config,
    }) as Promise<T>;
  }

  async patch<T>(endpoint: string, data?: any, config?: any): Promise<T> {
    return this.axiosInstance.patch<T>(endpoint, data, config) as Promise<T>;
  }
}

export const apiClient = new ApiClient();

// Helper functions to match web interface
export async function get<T>(
  url: string,
  params?: Record<string, any>
): Promise<T> {
  return apiClient.get<T>(url, params);
}

export async function post<T>(url: string, data?: any): Promise<T> {
  return apiClient.post<T>(url, data);
}

export async function put<T>(url: string, data?: any): Promise<T> {
  return apiClient.put<T>(url, data);
}

export async function patch<T>(url: string, data?: any): Promise<T> {
  return apiClient.patch<T>(url, data);
}

export async function del<T>(
  url: string,
  params?: Record<string, any>
): Promise<T> {
  return apiClient.delete<T>(url, params);
}
