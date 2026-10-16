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
  ImageOff,
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

export const RestaurantDetailModal: React.FC<
  RestaurantDetailModalProps
> = ({
