import { Movie } from "./movie.types";
import { Episode } from "./episode.types";
import { ApiResponse, PaginationMeta } from "./api.types";

export interface WatchHistoryItem {
  id: string;
  userId: string;
  movieId: string;
  episodeId: string | null;
  watchDurationSeconds: number;
  totalDurationSeconds: number | null;
  lastWatchedAt: string;
  movie: Movie;
  episode: Episode | null;
}

export interface WatchHistoryResponse extends ApiResponse {
  data: WatchHistoryItem[];
  meta: PaginationMeta;
}

export interface WatchProgressResponse extends ApiResponse {
  data: {
    id?: string;
    movieId: string;
    episodeId?: string;
    watchDurationSeconds: number;
    totalDurationSeconds?: number;
  } | null;
}

export interface UpdateWatchProgressDto {
  movieId: string;
  episodeId?: string;
  watchDurationSeconds: number;
  totalDurationSeconds?: number;
}
