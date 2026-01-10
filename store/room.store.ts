import { create } from "zustand";
import {
  Room,
  RoomMember,
  RoomMessage,
  RoomPlaylist,
  IRoomSetting,
  VideoChangedEvent,
  RoomType,
} from "../types/room.types";
import { roomService } from "../services/room.service";

interface RoomState {
  currentRoom: Room | null;
  isOwner: boolean;
  loading: boolean;
  error: string | null;
  isVerified: boolean; // Password verification status

  // Real-time data
  messages: RoomMessage[];
  hasMoreMessages: boolean;
  lastMessageId: string | null;
  members: RoomMember[];
  playlistItems: RoomPlaylist[];
  currentPlayingItem: RoomPlaylist | null;
  videoState: VideoChangedEvent | null;
  settings: IRoomSetting;

  // Actions
  fetchRoom: (code: string) => Promise<void>;
  addMessage: (message: RoomMessage) => void;
  loadMoreMessages: () => Promise<void>;
  setRoomData: (data: {
    messages: RoomMessage[];
    members: RoomMember[];
    playlistItems: RoomPlaylist[];
    settings: IRoomSetting;
  }) => void;
  addMember: (member: RoomMember) => void;
  removeMember: (userId: string) => void;
  updateMemberRole: (userId: string, role: string) => void;

  addPlaylistItem: (item: RoomPlaylist) => void;
  removePlaylistItem: (itemId: string) => void;
  updatePlaylistItemPosition: (itemId: string, newItem: RoomPlaylist) => void;
  setPlaylistItems: (items: RoomPlaylist[]) => void;
  reorderPlaylistOptimistic: (oldIndex: number, newIndex: number) => void;

  setCurrentPlayingItem: (item: RoomPlaylist | null) => void;
  setVideoState: (state: VideoChangedEvent | null) => void;
  setSettings: (settings: IRoomSetting) => void;
  setCurrentRoom: (room: Room | null, isOwner?: boolean) => void;

  clearRoom: () => void;
}

export const useRoomStore = create<RoomState>((set, get) => ({
  currentRoom: null,
  isOwner: false,
  loading: false,
  error: null,
  isVerified: false,

  messages: [],
  hasMoreMessages: true,
  lastMessageId: null,
  members: [],
  playlistItems: [],
  currentPlayingItem: null,
  videoState: null,
  settings: {
    type: RoomType.PUBLIC,
    max_video: 50,
    max_video_in_playlist: 50,
    max_users: 100,
  },

  setCurrentRoom: (room, isOwner = false) =>
    set({ currentRoom: room, isOwner }),

  fetchRoom: async (code: string) => {
    set({ loading: true, error: null });
    try {
      // In mobile app, we check room existence first.
      // Ideally, we should have an endpoint to get full room details if not joined yet,
      // but usually socket join provides the initial data.
      // Here we just fetch basic info to verify existence.
      const response = await roomService.checkRoom(code);
      if (response.data) {
        // We set a temporary room object with code. Real data comes from Socket Join.
        set({
          currentRoom: {
            ...response.data,
            code,
          } as Room,
          isOwner: response.data.isOwner || false,
          isVerified: response.data.type === "public" || response.data.isOwner,
          loading: false,
        });
      } else {
        set({ error: "Room not found", loading: false });
      }
    } catch (error: any) {
      set({ error: error.message || "Failed to fetch room", loading: false });
    }
  },

  setRoomData: (data) => {
    const lastMsg = data.messages.length > 0 ? data.messages[0] : null;
    set({
      messages: data.messages,
      hasMoreMessages: data.messages.length >= 20,
      lastMessageId: lastMsg?.id || null,
      members: data.members,
      playlistItems: [...data.playlistItems].sort(
        (a, b) => a.position - b.position
      ),
      settings: data.settings,
    });
  },

  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),

  loadMoreMessages: async () => {
    const { currentRoom, lastMessageId, hasMoreMessages } = get();

    if (!currentRoom?.code || !hasMoreMessages || !lastMessageId) {
      return;
    }

    try {
      const response = await roomService.getMessages(
        currentRoom.code,
        lastMessageId,
        20
      );

      if (response.success && response.data.length > 0) {
        // Prepend older messages to the beginning
        const olderMessages = response.data.reverse();
        set((state) => ({
          messages: [...olderMessages, ...state.messages],
          hasMoreMessages: response.pagination.hasMore,
          lastMessageId: response.pagination.lastMessageId,
        }));
      } else {
        set({ hasMoreMessages: false });
      }
    } catch (error) {
      console.error("Failed to load more messages:", error);
      throw error;
    }
  },

  addMember: (member) =>
    set((state) => ({ members: [...state.members, member] })),

  removeMember: (userId) =>
    set((state) => ({
      members: state.members.filter((m) => {
        const mUserId = typeof m.user === "string" ? m.user : m.user.id;
        return mUserId !== userId;
      }),
    })),

  updateMemberRole: (userId, role) =>
    set((state) => ({
      members: state.members.map((m) => {
        const mUserId = typeof m.user === "string" ? m.user : m.user.id;
        if (mUserId === userId) return { ...m, role: role as any };
        return m;
      }),
    })),

  addPlaylistItem: (item) =>
    set((state) => {
      const itemId = (item as any).id || (item as any)._id;
      const exists = state.playlistItems.some((existingItem) => {
        const existingId =
          (existingItem as any).id || (existingItem as any)._id;
        return existingId === itemId;
      });

      if (exists) {
        return state;
      }

      return {
        playlistItems: [...state.playlistItems, item].sort(
          (a, b) => a.position - b.position
        ),
      };
    }),

  removePlaylistItem: (itemId) =>
    set((state) => ({
      playlistItems: state.playlistItems.filter((item) => {
        const currentItemId = (item as any).id || (item as any)._id;
        return currentItemId !== itemId;
      }),
    })),

  updatePlaylistItemPosition: (itemId, updatedItem) =>
    set((state) => ({
      playlistItems: state.playlistItems
        .map((item) => {
          const currentItemId = (item as any).id || (item as any)._id;
          return currentItemId === itemId ? updatedItem : item;
        })
        .sort((a, b) => a.position - b.position),
    })),

  setPlaylistItems: (items) => set({ playlistItems: items }),

  reorderPlaylistOptimistic: (oldIndex, newIndex) =>
    set((state) => {
      const items = [...state.playlistItems];
      const [removed] = items.splice(oldIndex, 1);
      items.splice(newIndex, 0, removed);
      return { playlistItems: items };
    }),

  setCurrentPlayingItem: (item) => set({ currentPlayingItem: item }),

  setVideoState: (state) => set({ videoState: state }),

  setSettings: (settings) => set({ settings }),

  clearRoom: () =>
    set({
      currentRoom: null,
      isOwner: false,
      messages: [],
      hasMoreMessages: true,
      lastMessageId: null,
      members: [],
      playlistItems: [],
      currentPlayingItem: null,
      videoState: null,
      error: null,
      isVerified: false,
    }),
}));
