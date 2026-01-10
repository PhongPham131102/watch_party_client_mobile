import { apiClient } from "./api.service";
import { Episode, SearchEpisodeResponse } from "../types/episode.types";

export class EpisodeService {
  async searchEpisode(params: {
    query?: string;
    page?: number;
    limit?: number;
  }): Promise<SearchEpisodeResponse> {
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
        ? `episodes/search?${queryString}`
        : "episodes/search";

      const response = await apiClient.get<SearchEpisodeResponse>(url);
      return response;
    } catch (error) {
      console.error("Search episode error:", error);
      throw error;
    }
  }
}

export const episodeService = new EpisodeService();
