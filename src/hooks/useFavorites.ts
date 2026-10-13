import { useState, useEffect, useCallback } from 'react';
import { Restaurant } from '../types/restaurant';

const FAVORITES_STORAGE_KEY = 'cercanos_restaurantes_favoritos';

export function useFavorites() {
  const [favorites, setFavorites] = useState<Restaurant[]>(() => {
    try {
      const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
    } catch (e) {
      console.error('Error saving favorites to localStorage:', e);
    }
  }, [favorites]);

  const isFavorite = useCallback(
    (restaurantId: string) => {
      return favorites.some((item) => item.id === restaurantId);
    },
    [favorites]
  );

  const toggleFavorite = useCallback((restaurant: Restaurant) => {
    setFavorites((prev) => {
      const exists = prev.some((item) => item.id === restaurant.id);
      if (exists) {
        return prev.filter((item) => item.id !== restaurant.id);
      } else {
        return [restaurant, ...prev];
      }
    });
  }, []);

  const removeFavorite = useCallback((restaurantId: string) => {
    setFavorites((prev) => prev.filter((item) => item.id !== restaurantId));
  }, []);

  const updateFavoriteNote = useCallback((restaurantId: string, note: string) => {
    setFavorites((prev) =>
      prev.map((item) => (item.id === restaurantId ? { ...item, notes: note } : item))
    );
  }, []);

  const clearFavorites = useCallback(() => {
    setFavorites([]);
  }, []);

  return {
    favorites,
    isFavorite,
    toggleFavorite,
    removeFavorite,
    updateFavoriteNote,
    clearFavorites,
    favoritesCount: favorites.length,
  };
}
