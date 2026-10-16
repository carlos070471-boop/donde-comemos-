import React, { useState, useEffect } from 'react';

import {
  X,
  Heart,
  MapPin,
  Phone,
  Clock,
  Globe,
  ExternalLink,
  Navigation,
  Star,
  Copy,
  Check,
  FileEdit,
  Utensils,
  MessageSquare,
} from 'lucide-react';

import {
  Restaurant,
  RestaurantReview,
} from '../types/restaurant';

import {
  formatDistance,
  getDirectionsUrl,
} from '../utils/distance';

import {
  fetchRestaurantReviews,
} from '../services/PlacesService';

interface RestaurantDetailModalProps {
  restaurant: Restaurant | null;
  onClose: () => void;
  isFavorite: boolean;
  onToggleFavorite: (restaurant: Restaurant) => void;
  onUpdateNote: (
    restaurantId: string,
    note: string
  ) => void;
  onViewOnMap?: (restaurant: Restaurant) => void;
}

/*
 * Imagen alternativa integrada.
 * No necesita Internet.
 */

const FALLBACK_IMAGE =
  'data:image/svg+xml;charset=utf-8,' +
  encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg"
viewBox="0 0 800 
