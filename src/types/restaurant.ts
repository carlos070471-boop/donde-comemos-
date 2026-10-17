export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Restaurant {
  id: string;
  name: string;
  address: string;
  rating?: number;
  userRatingCount?: number;
  priceLevel?: number; // 1 to 4
  isOpenNow?: boolean;
  distanceMeters?: number;
  location: Coordinates;
  phoneNumber?: string;
  websiteUri?: string;
  photoUrl?: string;
  /** Verified, freely licensed image URLs; may be empty. */
  photoUrls?: string[];
  types?: string[];
  primaryType?: string;
  notes?: string;
  openingHoursSummary?: string;
}

export type SortOption = 'distance' | 'rating' | 'reviews';

export interface FilterOptions {
  searchQuery: string;
  selectedCategory: string;
  maxDistanceMeters: number;
  onlyOpenNow: boolean;
  sortBy: SortOption;
}
