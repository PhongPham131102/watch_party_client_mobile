import { apiClient } from "./api.service";
import { User } from "../types/auth.types";
import { Platform } from "react-native";

export interface UpdateProfileRequest {
  fullName?: string;
  avatarUrl?: string;
}

export interface UpdateProfileResponse {
  success: boolean;
  message: string;
  data: User;
}

export interface UploadAvatarResponse {
  success: boolean;
  message: string;
  data: User;
}

export class UserService {
  async updateProfile(
    data: UpdateProfileRequest
  ): Promise<UpdateProfileResponse> {
    try {
      const response = await apiClient.patch<UpdateProfileResponse>(
        "/users/profile",
        data
      );
      return response;
    } catch (error) {
      throw error;
    }
  }

  async uploadAvatar(
    fileUri: string,
    mimeType: string = "image/jpeg"
  ): Promise<UploadAvatarResponse> {
    try {
      const formData = new FormData();
      const filename = fileUri.split("/").pop() || "avatar.jpg";

      // @ts-ignore: FormData expects specific format in React Native
      formData.append("file", {
        uri: Platform.OS === "ios" ? fileUri.replace("file://", "") : fileUri,
        name: filename,
        type: mimeType,
      });

      const response = await apiClient.patch<UploadAvatarResponse>(
        "/users/avatar",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response;
    } catch (error) {
      throw error;
    }
  }
}

export const userService = new UserService();
