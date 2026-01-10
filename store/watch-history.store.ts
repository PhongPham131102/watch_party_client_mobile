import { create } from "zustand";
import { watchHistoryService } from "../services/watch-history.service";
import {
  WatchHistoryItem,
  UpdateWatchProgressDto,
} from "../types/watch-history.types";

interface WatchHistoryState {
  history: WatchHistoryItem[];
  progressMap: Record<string, { current: number; total: number }>;
  isLoading: boolean;
  error: string | null;

  fetchHistory: (page?: number, limit?: number) => Promise<void>;
  updateProgress: (dto: UpdateWatchProgressDto) => Promise<void>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getProgress: (movieId: string, episodeId?: string) => Promise<any>;
}

export const useWatchHistoryStore = create<WatchHistoryState>((set, get) => ({
  history: [],
  progressMap: {},
  isLoading: false,
  error: null,

  fetchHistory: async (page = 1, limit = 20) => {
    set({ isLoading: true, error: null });
    try {
      const response = await watchHistoryService.getMyHistory(page, limit);
      if (response.success) {
        const newProgressMap: Record<
          string,
          { current: number; total: number }
        > = {};
        response.data.forEach((item) => {
          newProgressMap[item.movieId] = {
            current: item.watchDurationSeconds,
            total: item.totalDurationSeconds || 0,
          };
        });
        set({
          history: response.data,
          progressMap: newProgressMap,
          isLoading: false,
        });
      } else {
        set({ error: response.message, isLoading: false });
      }
    } catch (error: any) {
      set({
        error: error?.message || "Failed to fetch watch history",
        isLoading: false,
      });
    }
  },

  updateProgress: async (dto: UpdateWatchProgressDto) => {
    await watchHistoryService.updateProgress(dto);

    set((state) => {
      const newHistory = state.history.map((item) => {
        if (
          item.movieId === dto.movieId &&
          (!dto.episodeId || item.episodeId === dto.episodeId)
        ) {
          return {
            ...item,
            watchDurationSeconds: dto.watchDurationSeconds,
            totalDurationSeconds:
              dto.totalDurationSeconds || item.totalDurationSeconds,
            lastWatchedAt: new Date().toISOString(),
          };
        }
        return item;
      });

      const newProgressMap = {
        ...state.progressMap,
        [dto.movieId]: {
          current: dto.watchDurationSeconds,
          total:
            dto.totalDurationSeconds ||
            state.progressMap[dto.movieId]?.total ||
            0,
        },
      };

      return { history: newHistory, progressMap: newProgressMap };
    });
  },

  getProgress: async (movieId: string, episodeId?: string) => {
    const response = await watchHistoryService.getProgressByMovie(
      movieId,
      episodeId
    );
    if (response.success && response.data) {
      set((state) => ({
        progressMap: {
          ...state.progressMap,
          [movieId]: {
            current: response.data!.watchDurationSeconds,
            total: response.data!.totalDurationSeconds || 0,
          },
        },
      }));
    }
    return response.data;
  },
}));
