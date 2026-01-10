import { useQuery } from "@tanstack/react-query";
import { heroSectionService } from "../services/hero-section.service";
import type { HeroSection } from "../types/hero-section.types";

export const useHeroSections = () => {
  return useQuery<HeroSection[], Error>({
    queryKey: ["hero-sections", "public"],
    queryFn: () => heroSectionService.getPublicHeroSections(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};
