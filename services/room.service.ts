import { apiClient } from "./api.service";
import {
  CreateRoomRequest,
  CreateRoomResponse,
  CheckRoomResponse,
  VerifyRoomPasswordResponse,
} from "../types/room.types";

export interface Room {
  id: string;
  name: string;
  code: string;
  ownerId: string;
  status: string;
  currentViewers: number;
  owner?: {
    id: string;
    profile?: {
      fullName: string;
      avatarUrl: string;
    };
  };
}

export interface GetPublicRoomsResponse {
  success: boolean;
  message: string;
  data: Room[];
}

export class RoomService {
  async getCurrentPublicRoom(): Promise<GetPublicRoomsResponse> {
    try {
      const response = await apiClient.get<GetPublicRoomsResponse>(
        "/rooms/get-public-rooms"
      );
      return response;
    } catch (error) {
      console.error("Error fetching public rooms:", error);
      throw error;
    }
  }

  async checkRoom(code: string): Promise<CheckRoomResponse> {
    try {
      const response = await apiClient.get<CheckRoomResponse>(
        `/rooms/check-room/${code}`
      );
      return response;
    } catch (error) {
      console.error("Error checking room:", error);
      throw error;
    }
  }

  async createRoom(data: CreateRoomRequest): Promise<CreateRoomResponse> {
    try {
      const response = await apiClient.post<CreateRoomResponse>("/rooms", data);
      return response;
    } catch (error) {
      console.error("Error creating room:", error);
      throw error;
    }
  }

  async verifyRoomPassword(
    code: string,
    password: string
  ): Promise<VerifyRoomPasswordResponse> {
    try {
      const response = await apiClient.post<VerifyRoomPasswordResponse>(
        `/rooms/verify-password/${code}`,
        { password }
      );
      return response;
    } catch (error) {
      console.error("Error verifying room password:", error);
      throw error;
    }
  }

  async getMessages(
    roomCode: string,
    lastMessageId: string,
    limit: number = 20
  ): Promise<any> {
    try {
      // Build query string like web version
      let url = `/room-messages?roomCode=${roomCode}&limit=${limit}`;
      if (lastMessageId) {
        url += `&lastMessageId=${lastMessageId}`;
      }

      const response = await apiClient.get<any>(url);
      return response;
    } catch (error) {
      console.error("Error fetching more messages:", error);
      throw error;
    }
  }
}

export const roomService = new RoomService();
