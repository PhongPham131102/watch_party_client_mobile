import { BaseEntity } from "./api.types";
import { User } from "./auth.types";
import { Episode } from "./episode.types";

export interface Room extends BaseEntity {
  name: string;
  code: string;
  ownerId: string;
  status: string;
  type: RoomType;
  currentViewers: number;
  owner?: User;
}

export enum RoomType {
  PUBLIC = "public",
  PRIVATE = "private",
}

export interface IRoomSetting {
  type: RoomType;
  max_video: number;
  max_video_in_playlist: number;
  max_users: number;
}

export enum RoomMemberRole {
  OWNER = "owner",
  ADMIN = "admin",
  MODERATOR = "moderator",
  MEMBER = "member",
}

export interface RoomMember extends BaseEntity {
  room: string | Room;
  user: string | User;
  role: RoomMemberRole;
}

export interface RoomMessage extends BaseEntity {
  content: string;
  room: string | Room;
  sender: User;
  type: "text" | "system";
}

export interface RoomPlaylist extends BaseEntity {
  room: string | Room;
  video: string | Episode;
  position: number;
  addBy: string | User;
}

export enum PlaylistAction {
  ADD = "add",
  REMOVE = "remove",
  REORDER = "reorder",
}

export interface PlaylistUpdatedEvent {
  item: RoomPlaylist;
  action: PlaylistAction;
  addedBy?: string;
  removedBy?: string;
  reorderedBy?: string;
  isDuplicate?: boolean;
  duplicateCount?: number;
}

export interface VideoChangedEvent {
  current_playlist_id?: string;
  is_playing: "playing" | "paused";
  current_time: number;
  updated_at: number;
}

export interface UserJoinedEvent {
  userId: string;
  username: string;
  role: string;
}

export interface UserLeftEvent {
  userId: string;
  username: string;
}

export interface MemberRemovedEvent {
  userId: string;
  username: string;
  roomId: string;
  timestamp: string;
}

export interface UserKickedEvent {
  userId: string;
  kickedBy: string;
  reason: string;
}

export interface UserRoleChangedEvent {
  userId: string;
  newRole: string;
  changedBy: string;
}

export interface ForceDisconnectEvent {
  reason: string;
  timestamp: string;
}

export interface JoinRoomResponse {
  success: boolean;
  lastestMessages: RoomMessage[];
  members: RoomMember[];
  playlistItems: RoomPlaylist[];
  settings: IRoomSetting;
  currentState?: VideoChangedEvent | null;
}

export interface CreateRoomRequest {
  name: string;
  isPublic: boolean;
}

export interface SendMessageResponse {
  success: boolean;
  message: RoomMessage;
}

export interface CheckRoomResponse {
  success: boolean;
  message: string;
  data: Room & { isOwner: boolean };
}

export interface GetPublicRoomsResponse {
  success: boolean;
  message: string;
  data: Room[];
}

export interface PlaylistOperationResponse {
  success: boolean;
  message: string;
  item?: RoomPlaylist;
  itemId?: string;
  isDuplicate?: boolean;
  duplicateCount?: number;
}

export interface KickUserResponse {
  success: boolean;
  message: string;
}

export interface ChangeUserRoleResponse {
  success: boolean;
  message: string;
  newRole: string;
}

export interface CreateRoomRequest {
  name: string;
  type: RoomType;
  password?: string;
}

export interface CreateRoomResponse {
  success: boolean;
  message: string;
  data: Room;
}

export interface VerifyRoomPasswordRequest {
  password: string;
}

export interface VerifyRoomPasswordResponse {
  success: boolean;
  message: string;
  data: {
    isAuthenticated: boolean;
  };
}
