/* eslint-disable @typescript-eslint/no-unused-expressions */
import { Socket, io } from "socket.io-client";
import { API_BASE_URL } from "../constants/api";
import {
  JoinRoomResponse,
  UserJoinedEvent,
  UserLeftEvent,
  IRoomSetting,
  SendMessageResponse,
  RoomMessage,
  MemberRemovedEvent,
  RoomMember,
  UserKickedEvent,
  UserRoleChangedEvent,
  ForceDisconnectEvent,
  KickUserResponse,
  ChangeUserRoleResponse,
  PlaylistOperationResponse,
  PlaylistUpdatedEvent,
  VideoChangedEvent,
} from "../types/room.types";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface SocketErrorEvent {
  success: false;
  error: string;
  errorCode: string;
  event: string;
  timestamp: string;
}

class RoomSocketService {
  private socket: Socket | null = null;
  private isAuthenticated = false;

  private async getAuthToken(): Promise<string | null> {
    return await AsyncStorage.getItem("accessToken");
  }

  async connect(): Promise<Socket> {
    return new Promise(async (resolve, reject) => {
      if (this.socket?.connected && this.isAuthenticated) {
        resolve(this.socket);
        return;
      }

      const token = await this.getAuthToken();
      if (!token) {
        reject(new Error("No access token found"));
        return;
      }

      // CRITICAL: Socket server runs on base URL, NOT on /api/v1
      // Web uses: http://localhost:8888/room
      // Mobile should use: http://192.168.1.15:8888/room (without /api/v1)
      const SOCKET_BASE_URL = API_BASE_URL.replace("/api/v1", "");
      const socketUrl = `${SOCKET_BASE_URL}/room`;

      console.log("Connecting to socket:", socketUrl);

      this.socket = io(socketUrl, {
        withCredentials: true,
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        transports: ["websocket", "polling"],
        auth: {
          token: token,
        },
      });

      this.socket.once(
        "authenticated",
        (data: {
          success: boolean;
          userId: string;
          username: string;
          timestamp: string;
        }) => {
          console.log("Room socket authenticated:", data);
          this.isAuthenticated = true;
          resolve(this.socket!);
        }
      );

      this.socket.once("connect_error", (error) => {
        console.error("Room socket connection error:", error);
        this.isAuthenticated = false;
        reject(error);
      });

      this.socket.on("error", (error) => {
        console.error("Room socket error:", error);
      });

      setTimeout(() => {
        if (!this.isAuthenticated) {
          reject(new Error("Authentication timeout"));
        }
      }, 10000);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isAuthenticated = false;
    }
  }

  async joinRoom(roomCode: string): Promise<JoinRoomResponse> {
    if (!this.socket?.connected) await this.connect();

    return new Promise((resolve, reject) => {
      const errorListener = (error: SocketErrorEvent) => {
        if (error.event === "joinRoom") {
          this.socket!.off("error", errorListener);
          reject(error);
        }
      };

      this.socket!.once("error", errorListener);

      this.socket!.emit(
        "joinRoom",
        { roomCode },
        (response: JoinRoomResponse) => {
          this.socket!.off("error", errorListener);
          // Check if response is strictly the object we expect or if it has success flag
          // The web implementation suggests response.success check
          (response as any).success || response
            ? resolve(response)
            : reject(new Error("Failed to join room"));
        }
      );
    });
  }

  leaveRoom(roomCode: string): void {
    if (!this.socket?.connected) {
      return;
    }
    this.socket.emit("leaveRoom", { roomCode });
  }

  onUserJoined(callback: (data: UserJoinedEvent) => void): void {
    this.socket?.on("userJoined", callback);
  }

  onUserLeft(callback: (data: UserLeftEvent) => void): void {
    this.socket?.on("userLeft", callback);
  }
  onRoomSettingsUpdated(callback: (data: IRoomSetting) => void): void {
    this.socket?.on("roomSettingsUpdated", callback);
  }
  async sendMessage(
    roomCode: string,
    content: string
  ): Promise<SendMessageResponse> {
    if (!this.socket?.connected) throw new Error("Socket not connected");

    return new Promise((resolve, reject) => {
      this.socket!.emit(
        "sendMessage",
        { roomCode, content },
        (response: SendMessageResponse) => {
          response.success
            ? resolve(response)
            : reject(new Error("Failed to send message"));
        }
      );
    });
  }

  onNewMessage(callback: (data: RoomMessage) => void): void {
    this.socket?.on("newMessage", callback);
  }

  onMemberRemoved(callback: (data: MemberRemovedEvent) => void): void {
    this.socket?.on("memberRemoved", callback);
  }

  onMemberAdded(callback: (data: RoomMember) => void): void {
    this.socket?.on("memberAdded", callback);
  }

  onUserKicked(callback: (data: UserKickedEvent) => void): void {
    this.socket?.on("userKicked", callback);
  }

  onUserRoleChanged(callback: (data: UserRoleChangedEvent) => void): void {
    this.socket?.on("userRoleChanged", callback);
  }

  onForceDisconnect(callback: (data: ForceDisconnectEvent) => void): void {
    this.socket?.on("forceDisconnect", callback);
  }

  // Off methods
  offNewMessage(): void {
    this.socket?.off("newMessage");
  }
  offUserJoined(): void {
    this.socket?.off("userJoined");
  }
  offUserLeft(): void {
    this.socket?.off("userLeft");
  }
  offMemberRemoved(): void {
    this.socket?.off("memberRemoved");
  }
  offMemberAdded(): void {
    this.socket?.off("memberAdded");
  }
  offUserKicked(): void {
    this.socket?.off("userKicked");
  }
  offUserRoleChanged(): void {
    this.socket?.off("userRoleChanged");
  }
  offForceDisconnect(): void {
    this.socket?.off("forceDisconnect");
  }
  offPlaylistUpdated(): void {
    this.socket?.off("playlistUpdated");
  }
  offVideoChanged(): void {
    this.socket?.off("videoChanged");
  }

  async kickUser(
    roomCode: string,
    targetUserId: string
  ): Promise<KickUserResponse> {
    if (!this.socket?.connected) throw new Error("Socket not connected");

    return new Promise((resolve, reject) => {
      this.socket!.emit(
        "kickUser",
        { roomCode, targetUserId },
        (response: KickUserResponse) => {
          response.success
            ? resolve(response)
            : reject(new Error("Failed to kick user"));
        }
      );
    });
  }

  async changeUserRole(
    roomCode: string,
    targetUserId: string,
    newRole: string
  ): Promise<ChangeUserRoleResponse> {
    if (!this.socket?.connected) throw new Error("Socket not connected");

    return new Promise((resolve, reject) => {
      this.socket!.emit(
        "changeUserRole",
        { roomCode, targetUserId, newRole },
        (response: ChangeUserRoleResponse) => {
          response.success
            ? resolve(response)
            : reject(new Error("Failed to change role"));
        }
      );
    });
  }

  // PLAYLIST
  async addToPlaylist(
    roomCode: string,
    episodeId: string,
    position?: number
  ): Promise<PlaylistOperationResponse> {
    if (!this.socket?.connected) throw new Error("Socket not connected");

    return new Promise((resolve, reject) => {
      this.socket!.emit(
        "addToPlaylist",
        { roomCode, episodeId, position },
        (response: PlaylistOperationResponse) => {
          if (response.success) {
            resolve(response);
          } else {
            reject(new Error(response.message || "Failed to add to playlist"));
          }
        }
      );
    });
  }

  async removeFromPlaylist(
    roomCode: string,
    playlistItemId: string
  ): Promise<PlaylistOperationResponse> {
    if (!this.socket?.connected) throw new Error("Socket not connected");

    return new Promise((resolve, reject) => {
      this.socket!.emit(
        "removeFromPlaylist",
        { roomCode, playlistItemId },
        (response: PlaylistOperationResponse) => {
          if (response.success) {
            resolve(response);
          } else {
            reject(
              new Error(response.message || "Failed to remove from playlist")
            );
          }
        }
      );
    });
  }

  async reorderPlaylist(
    roomCode: string,
    playlistItemId: string,
    newPosition: number
  ): Promise<PlaylistOperationResponse> {
    if (!this.socket?.connected) throw new Error("Socket not connected");

    return new Promise((resolve, reject) => {
      this.socket!.emit(
        "reorderPlaylist",
        { roomCode, playlistItemId, newPosition },
        (response: PlaylistOperationResponse) => {
          if (response.success) {
            resolve(response);
          } else {
            reject(new Error(response.message || "Failed to reorder playlist"));
          }
        }
      );
    });
  }

  // VIDEO CONTROL
  async playOrPauseVideo(data: {
    roomCode: string;
    isplaying: boolean;
    currentTime: number;
  }): Promise<void> {
    if (!this.socket?.connected) throw new Error("Socket not connected");
    this.socket.emit("playOrPauseVideo", data);
  }

  async seekVideo(data: {
    roomCode: string;
    currentTime: number;
  }): Promise<void> {
    if (!this.socket?.connected) throw new Error("Socket not connected");
    this.socket.emit("seekVideo", data);
  }

  async nextVideo(data: { roomCode: string }): Promise<void> {
    if (!this.socket?.connected) throw new Error("Socket not connected");
    this.socket.emit("nextVideo", data);
  }

  async previousVideo(data: { roomCode: string }): Promise<void> {
    if (!this.socket?.connected) throw new Error("Socket not connected");
    this.socket.emit("previousVideo", data);
  }

  async playVideoFromPlaylist(data: {
    roomCode: string;
    playlistItemId: string;
  }): Promise<void> {
    if (!this.socket?.connected) throw new Error("Socket not connected");
    this.socket.emit("playVideoFromPlaylist", data);
  }

  // LISTENERS
  onPlaylistUpdated(callback: (data: PlaylistUpdatedEvent) => void): void {
    this.socket?.on("playlistUpdated", callback);
  }

  onVideoChanged(callback: (data: VideoChangedEvent) => void): void {
    this.socket?.on("videoChanged", callback);
  }
  async editRoomSettings(
    roomCode: string,
    settings: Partial<IRoomSetting> & { password?: string }
  ): Promise<void> {
    if (!this.socket?.connected) throw new Error("Socket not connected");
    this.socket.emit("updateRoomSettings", { roomCode, ...settings });
  }

  offRoomSettingsUpdated(): void {
    this.socket?.off("roomSettingsUpdated");
  }
}

export const roomSocketService = new RoomSocketService();
