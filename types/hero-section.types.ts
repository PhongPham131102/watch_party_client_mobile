import { Movie } from "./movie.types";

/**
 * Hero Section Type
 * Định nghĩa cấu trúc dữ liệu hero section từ backend
 */
export interface HeroSection {
  id: string;
  movie: Movie;
  order: number;
  isActive: boolean;
  title: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

/**
 * Response từ API GET /hero-sections/public
 */
export interface GetHeroSectionsPublicResponse {
  success: boolean;
  message: string;
  data: HeroSection[];
  timestamp?: string;
  path?: string;
}
