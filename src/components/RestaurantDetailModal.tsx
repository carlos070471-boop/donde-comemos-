
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

export const RestaurantDetailModal: React.FC<RestaurantDetailModalProps> = ({
  restaurant,
  onClose,
  isFavorite,
  onToggleFavorite,
  onUpdateNote,
  onViewOnMap,
}) => {
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteSaved, setNoteSaved] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setNoteText(restaurant?.notes || '');
    setIsEditingNote(false);
    setNoteSaved(false);
    setCopiedAddress(false);
    setImageError(false);
  }, [restaurant?.id, restaurant?.notes, restaurant?.photoUrl]);

  if (!restaurant) return null;

  const currentRestaurant = restaurant;
  const hasPhoto = Boolean(restaurant.photoUrl) && !imageError;

  const priceString = restaurant.priceLevel
    ? '€'.repeat(restaurant.priceLevel)
    : null;

  const handleCopyAddress = async () => {
    if (!currentRestaurant.address) return;

    try {
      await navigator.clipboard.writeText(
        currentRestaurant.address
      );
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    } catch (error) {
      console.warn('No se pudo copiar la dirección:', error);
    }
  };

  const handleSaveNote = () => {
    onUpdateNote(currentRestaurant.id, noteText);
    setIsEditingNote(false);
    setNoteSaved(true);
    setTimeout(() => setNoteSaved(false), 2000);
  };

  const menuSearchUrl =
    'https://www.google.com/search?q=' +
    encodeURIComponent(
      `${restaurant.name} ${restaurant.address} carta menú`
    );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm"
      role="presentation"
    >
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
        {/* Fotografía real */}
        <div className="relative h-56 sm:h-64 w-full bg-stone-200 shrink-0">

          {hasPhoto ? (
            <img
              src={restaurant.photoUrl}
              alt={`Fotografía de ${restaurant.name}`}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-stone-500">
              <ImageOff className="w-10 h-10" />
              <span className="text-sm">
                Fotografía no disponible
              </span>
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-transparent pointer-events-none" />

          {/* Cerrar */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-stone-900/60 hover:bg-stone-900/80 text-white rounded-full"
            title="Cerrar detalles"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Favoritos */}
          <button
            type="button"
            onClick={() => onToggleFavorite(restaurant)}
            className={`absolute top-4 left-4 p-2.5 rounded-full shadow-md ${
              isFavorite
                ? 'bg-rose-500 text-white'
                : 'bg-white/90 text-stone-700'
            }`}
            title={isFavorite ? 'Quitar de favoritos' : 'Guardar en favoritos'}
          >
            <Heart
              className={`w-5 h-5 ${
                isFavorite ? 'fill-white' : ''
              }`}
            />
          </button>

          {/* Nombre y categoría */}
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

        {/* Información */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">

          {/* Valoraciones y distancia */}
          <div className="flex items-center justify-between pb-4 border-b border-stone-100 flex-wrap gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              {restaurant.rating != null ? (
                <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-xl text-amber-800 font-bold text-sm">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                  <span>{restaurant.rating.toFixed(1)}</span>
                </div>
              ) : (
                <span className="text-xs text-stone-500">
                  Sin valoraciones
                </span>
              )}

              {restaurant.userRatingCount != null &&
                restaurant.userRatingCount > 0 && (
                  <span className="text-xs text-stone-500">
                    ({restaurant.userRatingCount} valoraciones en Google)
                  </span>
                )}
            </div>

            {restaurant.distanceMeters !== undefined && (
              <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-600 bg-stone-100 px-3 py-1 rounded-full">
                <Navigation className="w-3.5 h-3.5 text-amber-600" />
                <span>
                  a {formatDistance(restaurant.distanceMeters)} de ti
                </span>
              </div>
            )}
          </div>

          {/* Acciones rápidas */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <a
              href={getDirectionsUrl(
                restaurant.location,
                restaurant.name
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs sm:text-sm"
            >
              <Navigation className="w-4 h-4" />
              Cómo llegar
            </a>

            {restaurant.phoneNumber ? (
              <a
                href={`tel:${restaurant.phoneNumber}`}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold text-xs sm:text-sm"
              >
                <Phone className="w-4 h-4 text-emerald-600" />
                Llamar
              </a>
            ) : (
              <div className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-stone-50 text-stone-400 text-xs sm:text-sm">
                <Phone className="w-4 h-4" />
                Sin teléfono
              </div>
            )}

            <a
              href={restaurant.websiteUri || menuSearchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="col-span-2 sm:col-span-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold text-xs sm:text-sm"
            >
              {restaurant.websiteUri ? (
                <Globe className="w-4 h-4 text-blue-600" />
              ) : (
                <Utensils className="w-4 h-4 text-amber-600" />
              )}
              <span>
                {restaurant.websiteUri ? 'Web / Menú' : 'Buscar menú'}
              </span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Dirección */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400">
              Información del restaurante
            </h3>

            <div className="flex items-start justify-between gap-3 p-3.5 rounded-2xl bg-stone-50 border border-stone-200">
              <div className="flex items-start gap-3 min-w-0">
                <MapPin className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs text-stone-500 block">
                    Dirección completa
                  </span>
                  <span className="text-sm font-semibold text-stone-800">
                    {restaurant.address || 'No disponible'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCopyAddress}
                className="p-2 text-stone-500 hover:bg-stone-200 rounded-lg shrink-0"
                title="Copiar dirección"
              >
                {copiedAddress ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Teléfono */}
            <div className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-stone-50 border border-stone-200">
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <span className="text-xs text-stone-500 block">
                    Teléfono de contacto
                  </span>
                  <span className="text-sm font-semibold text-stone-800">
                    {restaurant.phoneNumber || 'No disponible'}
                  </span>
                </div>
              </div>

              {restaurant.phoneNumber && (
                <a
                  href={`tel:${restaurant.phoneNumber}`}
                  className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 text-white rounded-lg"
                >
                  Llamar
                </a>
              )}
            </div>

            {/* Horario */}
            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-stone-50 border border-stone-200">
              <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs text-stone-500 block">
                  Horario de apertura
                </span>
                <span className="text-sm font-semibold text-stone-800 block">
                  {restaurant.openingHoursSummary ||
                    'Consultar horario del establecimiento'}
                </span>
                <p className="text-xs text-stone-400 mt-1">
                  Los horarios pueden variar en festivos.
                </p>
              </div>
            </div>

            {/* Web */}
            <div className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-stone-50 border border-stone-200">
              <div className="flex items-center gap-3 min-w-0">
                <Globe className="w-5 h-5 text-blue-600 shrink-0" />
                <div className="min-w-0">
                  <span className="text-xs text-stone-500 block">
                    Página web o menú
                  </span>
                  <span className="text-sm font-semibold text-stone-800 truncate block">
                    {restaurant.websiteUri || 'Buscar menú en Google'}
                  </span>
                </div>
              </div>

              <a
                href={restaurant.websiteUri || menuSearchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 text-xs font-semibold bg-stone-800 text-white rounded-lg shrink-0"
              >
                Visitar
              </a>
            </div>
          </div>

          {/* Notas personales */}
          <div className="pt-2 border-t border-stone-100">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-stone-500">
                <FileEdit className="w-4 h-4 text-amber-600" />
                Tus notas personales
              </div>

              {noteSaved && (
                <span className="text-xs text-emerald-600">
                  ¡Nota guardada!
                </span>
              )}
            </div>

            {isEditingNote ? (
              <div className="space-y-2">
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Escribe tus notas sobre este restaurante..."
                  rows={3}
                  className="w-full p-3 text-sm bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:border-amber-500"
                />

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setNoteText(restaurant.notes || '');
                      setIsEditingNote(false);
                    }}
                    className="px-3 py-1.5 text-xs text-stone-600"
                  >
                    Cancelar
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveNote}
                    className="px-4 py-1.5 text-xs font-semibold bg-amber-500 text-white rounded-lg"
                  >
                    Guardar nota
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditingNote(true)}
                className="w-full text-left p-3.5 rounded-2xl bg-amber-50 border border-amber-200"
              >
                {noteText ? (
                  <p className="text-sm text-stone-700 italic">
                    "{noteText}"
                  </p>
                ) : (
                  <p className="text-xs text-stone-500 italic">
                    Toca aquí para añadir una nota privada.
                  </p>
                )}

                <span className="block mt-2 text-right text-xs font-semibold text-amber-700">
                  {noteText ? 'Editar nota' : 'Añadir nota'}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Botones inferiores */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={() => onToggleFavorite(restaurant)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border ${
              isFavorite
                ? 'bg-rose-50 border-rose-200 text-rose-700'
                : 'bg-white border-stone-200 text-stone-700'
            }`}
          >
            <Heart
              className={`w-4 h-4 ${
                isFavorite ? 'fill-rose-600 text-rose-600' : ''
              }`}
            />
            <span>
              {isFavorite ? 'En tus favoritos' : 'Guardar en favoritos'}
            </span>
          </button>

          <div className="flex items-center gap-2">
            {onViewOnMap && (
              <button
                type="button"
                onClick={() => {
                  onViewOnMap(restaurant);
                  onClose();
                }}
                className="px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-stone-200 text-stone-800"
              >
                Ver en mapa
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-stone-900 text-white"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
