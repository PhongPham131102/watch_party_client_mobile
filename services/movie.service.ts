/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiClient } from "./api.service";
import type { Movie, FindMoviesQueryDto, PaginationMeta } from "../types";

export interface GetPublicMoviesResponse {
  success: boolean;
  message: string;
  data: {
    data: Movie[];
    meta: PaginationMeta;
  };
  timestamp?: string;
  path?: string;
}

export interface GetMovieDetailResponse {
  success: boolean;
  message: string;
  data: Movie;
  timestamp?: string;
  path?: string;
}

export interface GetRecommendationsResponse {
  success: boolean;
  message: string;
  data: {
    data: Movie[];
  };
  timestamp?: string;
  path?: string;
}

export class MovieService {
  async getPublicMovies(
    params: FindMoviesQueryDto = {}
  ): Promise<GetPublicMoviesResponse> {
    try {
      const queryParams = new URLSearchParams();

      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          if (Array.isArray(value)) {
            value.forEach((item) => {
              queryParams.append(key, item.toString());
            });
          } else {
            queryParams.append(key, value.toString());
          }
        }
      });

      const queryString = queryParams.toString();
      const url = queryString
        ? `/movies/public?${queryString}`
        : "/movies/public";

      const response = await apiClient.get<GetPublicMoviesResponse>(url);
      return response;
    } catch (error: any) {
      console.error("Error fetching public movies:", error);
      throw error;
    }
  }

  async getMovieBySlug(slug: string): Promise<Movie> {
    try {
      const response = await apiClient.get<GetMovieDetailResponse>(
        `/movies/public/${slug}`
      );

      if (!response?.data) {
        throw new Error("Movie data is invalid");
      }

      return response.data;
    } catch (error: any) {
      console.error("Error fetching movie detail:", error);
      throw error;
    }
  }

  async getRecommendations(slug: string, limit?: number): Promise<Movie[]> {
    try {
      const query = limit ? `?limit=${limit}` : "";
      const response = await apiClient.get<GetRecommendationsResponse>(
        `/movies/public/${slug}/recommendations${query}`
      );

      return response?.data?.data ?? [];
    } catch (error: any) {
      console.error("Error fetching recommendations:", error);
      throw error;
    }
  }

  async getFavoriteMovies(): Promise<GetPublicMoviesResponse> {
    try {
      const response = await apiClient.get<GetPublicMoviesResponse>(
        "/user-favorites"
      );
      return response;
    } catch (error: any) {
      console.error("Error fetching favorite movies:", error);
      throw error;
    }
  }

  async toggleFavorite(movieId: string): Promise<any> {
    try {
      const response = await apiClient.post<any>("/user-favorites/toggle", {
        movieId,
      });
      return response;
    } catch (error: any) {
      console.error("Error toggling favorite status:", error);
      throw error;
    }
  }

  async checkIsFavorite(movieId: string): Promise<{ isFavorite: boolean }> {
    try {
      const response = await apiClient.get<{ isFavorite: boolean }>(
        `/user-favorites/check/${movieId}`
      );
      return (response as any).data || response;
    } catch (error: any) {
      return { isFavorite: false };
    }
  }
}

export const movieService = new MovieService();
