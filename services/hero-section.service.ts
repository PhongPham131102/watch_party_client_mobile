/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiClient } from "./api.service";
import type {
  HeroSection,
  GetHeroSectionsPublicResponse,
} from "../types/hero-section.types";

export class HeroSectionService {
  async getPublicHeroSections(): Promise<HeroSection[]> {
    try {
      const response = await apiClient.get<GetHeroSectionsPublicResponse>(
        "/hero-sections/public"
      );

      if (!response?.data) {
        throw new Error("Hero sections data is invalid");
      }

      // Sắp xếp theo order để đảm bảo hiển thị đúng thứ tự
      const sortedData = [...response.data].sort((a, b) => a.order - b.order);

      return sortedData;
    } catch (error: any) {
      console.error("Error fetching public hero sections:", error);
      throw error;
    }
  }
}

export const heroSectionService = new HeroSectionService();
