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
} from 'lucide-react';

import { Restaurant } from '../types/restaurant';

import {
  formatDistance,
  getDirectionsUrl,
} from '../utils/distance';

interface RestaurantDetailModalProps {
  restaurant: Restaurant | null;
  onClose: () => void;
  isFavorite: boolean;
  onToggleFavorite: (restaurant: Restaurant) => void;
  onUpdateNote: (restaurantId: string, note: string) => void;
  onViewOnMap?: (restaurant: Restaurant) => void;
}

// Imagen ilustrativa integrada.
// Funciona sin conexión a Internet.
const FALLBACK_IMAGE =
  'data:image/svg+xml;charset=utf-8,' +
  encodeURIComponent(`
<svg xmlns="http://www.w3
