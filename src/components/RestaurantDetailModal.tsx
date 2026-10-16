import React, { useEffect, useState } from 'react';
import {
  X, Heart, MapPin, Phone, Clock, Globe, ExternalLink,
  Navigation, Star, Copy, Check, FileEdit, Utensils
} from 'lucide-react';
import { Restaurant, RestaurantReview } from '../types/restaurant';
import { formatDistance, getDirectionsUrl } from '../utils/distance';
import { fetchRestaurantReviews } from '../services/placesService';

interface RestaurantDetailModalProps {
  restaurant: Restaurant | null;
  onClose: () => void;
  isFavorite: boolean;
  onToggleFavorite: (restaurant: Restaurant) => void;
  onUpdateNote: (restaurantId: string, note: string) => void;
  onViewOnMap?: (restaurant: Restaurant) => void;
}

const FALLBACK_IMAGE = 'data:image/svg+xml;charset=utf-8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500">' +
    '<rect width="800" height="500" fill="#fde68a"/>' +
    '<rect x="125" y="115" width="550" height="290" fill="#fafaf9"/>' +
    '<rect x="125" y="115" width="550" height="65" fill="#92400e"/>' +
    '<text x="400" y="157" font-family="Arial" font-size="32" text-anchor="middle" fill="white">RESTAURANTE</text>' +
    '<rect x="165" y="205" width="150" height="135" fill="#a5d8e8"/>' +
    '<rect x="485" y="205" width="150" height="135" fill="#a5d8e8"/>' +
    '<rect x="345" y="205" width="110" height="200" fill="#78350f"/>' +
    '<rect x="110" y="180" width="580" height="30" fill="#d97706"/>' +
    '<rect y="445" width="800" height="55" fill="#292524"/>' +
    '<text x="400" y="477" font-family="Arial" font-size="22" text-anchor="middle" fill="white">Imagen ilustrativa</text>' +
    '</svg>'
  );

export const RestaurantDetailModal: React.FC<RestaurantDetailModalProps> = ({
  restaurant, onClose, isFavorite, onToggleFavorite, onUpdateNote, onViewOnMap
}) => {
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteSaved, setNoteSaved] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showReviews, setShowReviews] = useState(false);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reviews, setReviews] = useState<RestaurantReview[]>([]);

  useEffect(() => {
    setNoteText(restaurant?.notes || '');
    setIsEditingNote(false);
    setNoteSaved(false);
    setCopiedAddress(false);
    setImageError(false);
    setShowReviews(false);
    setReviews([]);
    setLoadingReviews(false);
  }, [restaurant?.id, restaurant?.notes, restaurant?.photoUrl]);

  useEffect(() => {
    if (!restaurant || !showReviews) return;

    let active = true;
    setLoadingReviews(true);

    fetchRestaurantReviews(restaurant.id)
      .then((items) => {
        if (active) setReviews(items);
      })
      .catch((error) => {
        console.error('No se pudieron cargar las reseñas:', error);
        if (active) setReviews([]);
      })
      .finally(() => {
        if (active) setLoadingReviews(false);
      });

    return () => {
      active = false;
    };
  }, [restaurant?.id, showReviews]);

  if (!restaurant) return null;

  const currentRestaurant = restaurant;
  const hasPhoto = Boolean(restaurant.photoUrl) && !imageError;
  const imageSource = hasPhoto ? restaurant.photoUrl : FALLBACK_IMAGE;

  const priceString = restaurant.priceLevel
    ? '€'.repeat(restaurant.priceLevel)
    : null;

  const handleCopyAddress = async () => {
    if (!currentRestaurant.address) return;

    try {
      await navigator.clipboard.writeText(currentRestaurant.address);
      setCopiedAddress(true);
      window.setTimeout(() => setCopiedAddress(false), 2000);
    } catch (error) {
      console.warn('No se pudo copiar la dirección:', error);
    }
  };

  const handleSaveNote = () => {
    onUpdateNote(currentRestaurant.id, noteText);
    setIsEditingNote(false);
    setNoteSaved(true);
    window.setTimeout(() => setNoteSaved(false), 2000);
  };

  const menuSearchUrl =
    'https://www.google.com/search?q=' +
    encodeURIComponent(
      `${restaurant.name} ${restaurant.address} carta menú`
    );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm">
      <div
        className="absolute inset-0"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Detalles de ${restaurant.name}`}
        className="relative w-full max-w-xl max-h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col z-10 border border-stone-200"
      >
        <div className="relative h-56 sm:h-64 w-full bg-stone-200 shrink-0">
          <img
            src={imageSource}
            alt={
              hasPhoto
                ? `Fotografía de ${restaurant.name}`
                : 'Imagen ilustrativa de un restaurante'
            }
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />

          {!hasPhoto && (
            <div className="absolute bottom-0 left-0 right-0 bg-stone-900/80 text-white text-[10px] text-center py-1">
              Imagen ilustrativa
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-transparent pointer-events-none" />

          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-stone-900/60 text-white rounded-full"
            title="Cerrar detalles"
          >
            <X className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={() => onToggleFavorite(restaurant)}
            className={`absolute top-4 left-4 p-2.5 rounded-full shadow-md ${
              isFavorite
                ? 'bg-rose-500 text-white'
                : 'bg-white/90 text-stone-700'
            }`}
          >
            <Heart
              className={`w-5 h-5 ${
                isFavorite ? 'fill-white' : ''
              }`}
            />
          </button>

          <div className="absolute bottom-4 left-5 right-5 text-white pointer-events-none">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500 text-white">
                {restaurant.primaryType || 'Restaurante'}
              </span>

              {priceString && (
                <span className="px-2.5 py-1 rounded-full text-xs bg-stone-800/70">
                  {priceString}
                </span>
              )}

              {restaurant.isOpenNow !== undefined && (
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    restaurant.isOpenNow
                      ? 'bg-emerald-600'
                      : 'bg-rose-600'
                  }`}
                >
                  {restaurant.isOpenNow
                    ? 'Abierto ahora'
                    : 'Cerrado ahora'}
                </span>
              )}
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold leading-tight">
              {restaurant.name}
            </h2>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-stone-100 flex-wrap gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              {restaurant.rating != null ? (
                <button
                  type="button"
                  onClick={() => setShowReviews(!showReviews)}
                  className="flex items-center gap-1 bg-amber-50 border border-
