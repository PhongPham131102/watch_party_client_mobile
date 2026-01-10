import { Episode } from "./episode.types";
export { Episode };

import { PaginationMeta } from "./api.types";
import { Genre } from "./genre.types";
import { Director } from "./director.types";
import { Actor } from "./actor.types";
import { Country } from "./country.types";

export interface Movie {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  originalTitle: string | null;
  releaseYear: number | null;
  durationMinutes: number | null;
  posterUrl: string | null;
  backdropUrl: string | null;
  titleImageUrl: string | null;
  trailerUrl: string | null;
  averageRating: string; // Backend trả về string
  totalRatings: number;
  totalViews: number;
  status: string;
  contentType: string; // 'movie' | 'series'
  genres: Genre[];
  directors: Director[];
  actors: Actor[];
  countries: Country[];
  episodes?: Episode[];
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

// Legacy format (for backward compatibility with mockMovies)
export interface MovieLegacy {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  originalTitle: string | null;
  releaseYear: number | null;
  durationMinutes: number | null;
  posterUrl: string | null;
  backdropUrl: string | null;
  titleImageUrl: string | null;
  trailerUrl: string | null;
  averageRating: number;
  totalRatings: number;
  totalViews: number;
  status: string;
  contentType: string;
  movieGenres?: Array<{ genre: { name: string } }>;
  movieDirectors?: Array<{ director: { name: string } }>;
  movieActors?: Array<{ actor: { name: string } }>;
  movieCountries?: Array<{ country: { name: string } }>;
  createdAt?: string;
  updatedAt?: string;
}

// Movies API Response
export interface MoviesResponse {
  data: Movie[];
  meta: PaginationMeta;
}

// Find Movies Query DTO (matching backend)
export interface FindMoviesQueryDto {
  page?: number;
  limit?: number;
  search?: string;
  status?: "draft" | "published" | "archived";
  contentType?: "movie" | "series";
  releaseYearFrom?: number;
  releaseYearTo?: number;
  durationMinutesFrom?: number;
  durationMinutesTo?: number;
  averageRatingFrom?: number;
  averageRatingTo?: number;
  totalRatingsFrom?: number;
  totalRatingsTo?: number;
  totalViewsFrom?: number;
  totalViewsTo?: number;
  genreIds?: string[];
  genreSlugs?: string[];
  countryIds?: string[];
  countrySlugs?: string[];
  actorIds?: string[];
  actorSlugs?: string[];
  directorIds?: string[];
  directorSlugs?: string[];
  sortBy?:
    | "title"
    | "releaseYear"
    | "averageRating"
    | "totalViews"
    | "totalRatings"
    | "durationMinutes"
    | "createdAt"
    | "updatedAt";
  sortOrder?: "ASC" | "DESC";
}
