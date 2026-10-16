import {
  Coordinates,
  Restaurant,
  RestaurantReview,
} from '../types/restaurant';

import { calculateDistance } from '../utils/distance';

/**
 * Busca restaurantes reales mediante Google Places.
 * Mantiene fotografías, valoraciones y demás datos.
 */
export async function fetchNearbyRestaurants(
  center: Coordinates,
  radiusMeters: number = 2500
): Promise<{
  restaurants: Restaurant[];
  source: 'google' | 'fallback';
}> {
  try {
    if (
      typeof window === 'undefined' ||
      !(window as any).google?.maps?.importLibrary
    ) {
      console.error('Google Maps no está disponible');

      return {
        restaurants: [],
        source: 'fallback',
      };
    }

    const placesLib = await (
      window as any
    ).google.maps.importLibrary('places');

    if (!placesLib?.Place?.searchNearby) {
      console.error('Google Places no está disponible');

      return {
        restaurants: [],
        source: 'fallback',
      };
    }

    const request = {
      fields: [
        'id',
        'displayName',
        'formattedAddress',
        'location',
        'rating',
        'userRatingCount',
        'priceLevel',
        'currentOpeningHours',
        'nationalPhoneNumber',
        'websiteURI',
        'types',
        'primaryType',
        'primaryTypeDisplayName',
        'photos',
      ],

      locationRestriction: {
        center: {
          lat: center.lat,
          lng: center.lng,
        },

        radius: Math.min(
          Math.max(radiusMeters, 1),
          50000
        ),
      },

      includedPrimaryTypes: [
        'restaurant',
        'cafe',
        'bar',
        'bakery',
        'meal_takeaway',
        'fast_food_restaurant',
        'pizza_restaurant',
        'seafood_restaurant',
        'mediterranean_restaurant',
        'spanish_restaurant',
        'mexican_restaurant',
        'italian_restaurant',
        'japanese_restaurant',
      ],

      maxResultCount: 20,
    };

    const response =
      await placesLib.Place.searchNearby(request);

    if (!response?.places?.length) {
      return {
        restaurants: [],
        source: 'google',
      };
    }

    const restaurants: Restaurant[] =
      response.places.map(
        (place: any, index: number) => {
          const lat =
            typeof place.location?.lat === 'function'
              ? place.location.lat()
              : place.location?.lat ?? center.lat;

          const lng =
            typeof place.location?.lng === 'function'
              ? place.location.lng()
              : place.location?.lng ?? center.lng;

          const location: Coordinates = {
            lat,
            lng,
          };

          /*
           * FOTOGRAFÍAS
           */

          let photoUrl: string | undefined;

          if (place.photos?.length) {
            try {
              const photos = [...place.photos];

              const getPhotoText = (
                photo: any
              ): string => {
                return [
                  photo.displayName,
                  photo.description,
                  photo.name,
                ]
