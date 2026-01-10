import { useQuery } from "@tanstack/react-query";
import { movieService } from "../services/movie.service";
import type { Movie, FindMoviesQueryDto } from "../types";

export const useMoviesByGenre = (
  genreSlug: string,
  params: Omit<FindMoviesQueryDto, "genreSlugs"> = {}
) => {
  return useQuery<{ data: Movie[]; meta: any }, Error>({
    queryKey: ["movies", "genre", genreSlug, params],
    queryFn: async () => {
      if (!genreSlug) return { data: [], meta: {} };
      const response = await movieService.getPublicMovies({
        ...params,
        genreSlugs: [genreSlug],
      });
      return response.data;
    },
    enabled: !!genreSlug,
    staleTime: 5 * 60 * 1000,
  });
};
