import React, { useState } from 'react';
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
  Share2,
  Copy,
  Check,
  FileEdit,
  Utensils,
} from 'lucide-react';
import { Restaurant } from '../types/restaurant';
import { formatDistance, getDirectionsUrl } from '../utils/distance';

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
  if (!restaurant) return null;

  const [copiedAddress, setCopiedAddress] = useState(false);
  const [noteText, setNoteText] = useState(restaurant.notes || '');
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteSaved, setNoteSaved] = useState(false);

  const handleCopyAddress = () => {
    if (restaurant.address) {
      navigator.clipboard.writeText(restaurant.address);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    }
  };

  const handleSaveNote = () => {
    onUpdateNote(restaurant.id, noteText);
    setIsEditingNote(false);
    setNoteSaved(true);
    setTimeout(() => setNoteSaved(false), 2000);
  };

  const priceString = restaurant.priceLevel
    ? '€'.repeat(restaurant.priceLevel)
    : '€€';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fadeIn">
      {/* Backdrop click to dismiss */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-xl max-h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col z-10 border border-stone-200">
        {/* Header Media */}
        <div className="relative h-56 sm:h-64 w-full bg-stone-200 shrink-0">
          <img
            src={restaurant.photoUrl}
            alt={restaurant.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-stone-950/20 to-transparent" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-stone-900/60 hover:bg-stone-900/80 text-white rounded-full backdrop-blur-md transition-colors"
            title="Cerrar detalles"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Favorite Toggle Button */}
          <button
            onClick={() => onToggleFavorite(restaurant)}
            className={`absolute top-4 left-4 p-2.5 rounded-full backdrop-blur-md transition-all shadow-md ${
              isFavorite
                ? 'bg-rose-500 text-white scale-105 hover:bg-rose-600'
                : 'bg-white/90 text-stone-700 hover:bg-white hover:text-rose-500'
            }`}
            title={isFavorite ? 'Quitar de favoritos' : 'Guardar en favoritos'}
          >
            <Heart
              className={`w-5 h-5 ${isFavorite ? 'fill-white' : ''}`}
            />
          </button>

          {/* Bottom Title inside photo banner */}
          <div className="absolute bottom-4 left-5 right-5 text-white">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/90 text-white backdrop-blur-xs">
                {restaurant.primaryType || 'Restaurante'}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/20 text-white backdrop-blur-xs">
                {priceString}
              </span>
              {restaurant.isOpenNow !== undefined && (
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold backdrop-blur-xs ${
                    restaurant.isOpenNow
                      ? 'bg-emerald-500/90 text-white'
                      : 'bg-rose-500/90 text-white'
                  }`}
                >
                  {restaurant.isOpenNow ? 'Abierto ahora' : 'Cerrado ahora'}
                </span>
              )}
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold leading-tight tracking-tight drop-shadow-xs">
              {restaurant.name}
            </h2>
          </div>
        </div>

        {/* Scrollable Body Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Rating, Reviews & Distance Bar */}
          <div className="flex items-center justify-between pb-4 border-b border-stone-100 flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-amber-50 border border-amber-200/80 px-2.5 py-1 rounded-xl text-amber-800 font-bold text-sm">
                <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                <span>{restaurant.rating?.toFixed(1) || '4.5'}</span>
              </div>
              <span className="text-xs text-stone-500">
                ({restaurant.userRatingCount || 120} valoraciones en Google)
              </span>
            </div>

            {restaurant.distanceMeters !== undefined && (
              <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-600 bg-stone-100 px-3 py-1 rounded-full">
                <Navigation className="w-3.5 h-3.5 text-amber-600" />
                <span>a {formatDistance(restaurant.distanceMeters)} de ti</span>
              </div>
            )}
          </div>

          {/* Quick Actions (Call, Directions, Website) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <a
              href={getDirectionsUrl(restaurant.location, restaurant.name)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs sm:text-sm shadow-xs transition-colors"
            >
              <Navigation className="w-4 h-4" />
              <span>Cómo llegar</span>
            </a>

            {restaurant.phoneNumber ? (
              <a
                href={`tel:${restaurant.phoneNumber}`}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold text-xs sm:text-sm transition-colors"
              >
                <Phone className="w-4 h-4 text-emerald-600" />
                <span>Llamar</span>
              </a>
            ) : (
              <button
                disabled
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-stone-50 text-stone-400 font-medium text-xs sm:text-sm cursor-not-allowed"
              >
                <Phone className="w-4 h-4" />
                <span>Sin teléfono</span>
              </button>
            )}

            {restaurant.websiteUri ? (
              <a
                href={restaurant.websiteUri}
                target="_blank"
                rel="noopener noreferrer"
                className="col-span-2 sm:col-span-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold text-xs sm:text-sm transition-colors"
              >
                <Globe className="w-4 h-4 text-blue-600" />
                <span>Web / Menú</span>
                <ExternalLink className="w-3 h-3 text-stone-400" />
              </a>
            ) : (
              <a
                href={`https://www.google.com/search?q=${encodeURIComponent(
                  `${restaurant.name} restaurante carta menu`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="col-span-2 sm:col-span-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold text-xs sm:text-sm transition-colors"
              >
                <Utensils className="w-4 h-4 text-amber-600" />
                <span>Buscar Menú</span>
                <ExternalLink className="w-3 h-3 text-stone-400" />
              </a>
            )}
          </div>

          {/* Full Information List */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400">
              Información de contacto y detalles
            </h3>

            {/* Complete Address */}
            <div className="flex items-start justify-between gap-3 p-3.5 rounded-2xl bg-stone-50 border border-stone-200/70">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-medium text-stone-500 block">
                    Dirección completa
                  </span>
                  <span className="text-sm font-semibold text-stone-800 leading-snug">
                    {restaurant.address || 'Ubicación no detallada'}
                  </span>
                </div>
              </div>
              <button
                onClick={handleCopyAddress}
                className="p-2 text-stone-500 hover:text-stone-800 hover:bg-stone-200/70 rounded-lg transition-colors shrink-0"
                title="Copiar dirección"
              >
                {copiedAddress ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Phone Number */}
            <div className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-stone-50 border border-stone-200/70">
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <span className="text-xs font-medium text-stone-500 block">
                    Teléfono de reservas y atención
                  </span>
                  <span className="text-sm font-semibold text-stone-800">
                    {restaurant.phoneNumber || 'No disponible'}
                  </span>
                </div>
              </div>
              {restaurant.phoneNumber && (
                <a
                  href={`tel:${restaurant.phoneNumber}`}
                  className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  Llamar
                </a>
              )}
            </div>

            {/* Opening Hours */}
            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-stone-50 border border-stone-200/70">
              <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-medium text-stone-500 block">
                  Horario de apertura
                </span>
                <span className="text-sm font-semibold text-stone-800 block">
                  {restaurant.openingHoursSummary ||
                    (restaurant.isOpenNow
                      ? 'Abierto al público habitualmente'
                      : 'Consultar horarios en el local')}
                </span>
                <p className="text-xs text-stone-400 mt-0.5">
                  Los horarios pueden variar en días festivos o temporadas especiales.
                </p>
              </div>
            </div>

            {/* Website or Online Menu */}
            <div className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-stone-50 border border-stone-200/70">
              <div className="flex items-center gap-3 min-w-0">
                <Globe className="w-5 h-5 text-blue-600 shrink-0" />
                <div className="min-w-0">
                  <span className="text-xs font-medium text-stone-500 block">
                    Sitio web oficial / Menú digital
                  </span>
                  <span className="text-sm font-semibold text-stone-800 truncate block">
                    {restaurant.websiteUri || 'Ver menú online en Google'}
                  </span>
                </div>
              </div>
              <a
                href={
                  restaurant.websiteUri ||
                  `https://www.google.com/search?q=${encodeURIComponent(
                    `${restaurant.name} restaurante menú`
                  )}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 text-xs font-semibold bg-stone-800 text-white rounded-lg hover:bg-stone-900 transition-colors shrink-0 flex items-center gap-1"
              >
                <span>Visitar</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* User Notes (Guardar notas en favoritos) */}
          <div className="pt-2 border-t border-stone-100">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-stone-500">
                <FileEdit className="w-3.5 h-3.5 text-amber-600" />
                <span>Tus notas personales</span>
              </div>
              {noteSaved && (
                <span className="text-xs font-semibold text-emerald-600 animate-fadeIn">
                  ¡Nota guardada!
                </span>
              )}
            </div>

            {isEditingNote ? (
              <div className="space-y-2">
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Ej: 'Probar el solomillo al Pedro Ximénez', 'Terraza muy agradable', etc."
                  rows={3}
                  className="w-full p-3 text-sm bg-stone-50 border border-stone-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-stone-800 placeholder:text-stone-400"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setNoteText(restaurant.notes || '');
                      setIsEditingNote(false);
                    }}
                    className="px-3 py-1.5 text-xs font-medium text-stone-600 hover:text-stone-800"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveNote}
                    className="px-4 py-1.5 text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white rounded-lg shadow-xs"
                  >
                    Guardar nota
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => setIsEditingNote(true)}
                className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/60 cursor-pointer hover:bg-amber-50 transition-colors group"
              >
                {noteText ? (
                  <p className="text-sm text-stone-700 italic">"{noteText}"</p>
                ) : (
                  <p className="text-xs text-stone-500 italic">
                    Toca aquí para añadir una nota privada sobre este restaurante (plato favorito, terraza, etc.).
                  </p>
                )}
                <div className="mt-2 text-right">
                  <span className="text-[11px] font-semibold text-amber-700 group-hover:underline">
                    {noteText ? 'Editar nota' : 'Añadir nota'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-stone-50 border-t border-stone-200/80 flex items-center justify-between gap-3 shrink-0">
          <button
            onClick={() => onToggleFavorite(restaurant)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all border ${
              isFavorite
                ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
                : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-100'
            }`}
          >
            <Heart
              className={`w-4 h-4 ${
                isFavorite ? 'fill-rose-600 text-rose-600' : 'text-stone-500'
              }`}
            />
            <span>{isFavorite ? 'En tus favoritos' : 'Guardar en favoritos'}</span>
          </button>

          <div className="flex items-center gap-2">
            {onViewOnMap && (
              <button
                onClick={() => {
                  onViewOnMap(restaurant);
                  onClose();
                }}
                className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-stone-200/80 hover:bg-stone-300 text-stone-800 transition-colors"
              >
                Ver en el mapa
              </button>
            )}
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-stone-900 hover:bg-black text-white transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
