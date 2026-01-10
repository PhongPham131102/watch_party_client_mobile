import { ApiResponse, BaseEntity } from "./api.types";
import { Movie } from "./movie.types";
export enum UploadVideoStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  SUCCESS = "SUCCESS",
  FAILED = "FAILED",
}

export enum VideoProcessingStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  SUCCESS = "SUCCESS",
  FAILED = "FAILED",
}

export interface Episode extends BaseEntity {
  movieId: string;

  episodeNumber: number;

  title: string;

  description: string;

  durationMinutes: number;

  thumbnailUrl: string;

  publishedAt: Date;

  rawVideoPath?: string;

  movie: Movie;

  masterM3u8S3: string;

  masterM3u8Minio: string;

  qualitiesS3: { quality: string; url: string }[];

  qualitiesMinio: { quality: string; url: string }[];

  uploadStatusS3: UploadVideoStatus;

  uploadStatusMinio: UploadVideoStatus;

  processingStatus: VideoProcessingStatus;
}

export interface SearchEpisodeResponse extends ApiResponse {
  data: { episodes: Episode[]; total: number; page: number; limit: number };
}
