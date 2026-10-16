import { RestaurantPhoto } from './RestaurantPhoto';
import React, { useState } from 'react';
import { Heart, Trash2, Utensils, Navigation, Phone, Search, FileEdit, Star } from 'lucide-react';
import { Restaurant } from '../types/restaurant';
import { formatDistance, getDirectionsUrl } from '../utils/distance';

interface FavoritesListProps {
  favorites: Restaurant[];
  onSelectRestaurant: (restaurant: Restaurant) => void;
  onRemoveFavorite: (restaurantId: string) => void;
  onClearFavorites: () => void;
  onExploreClick: () => void;
  onUpdateNote: (restaurantId: string, note: string) => void;
}

export const FavoritesList: React.FC<FavoritesListProps> = ({
  favorites,
  onSelectRestaurant,
  onRemoveFavorite,
  onClearFavorites,
  onExploreClick,
  onUpdateNote,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  const filteredFavorites = favorites.filter((r) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      r.name.toLowerCase().includes(term) ||
      (r.primaryType && r.primaryType.toLowerCase().includes(term)) ||
      (r.address && r.address.toLowerCase().includes(term)) ||
      (r.notes && r.notes.toLowerCase().includes(term))
    );
  });

  const handleStartEditNote = (restaurant: Restaurant, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingNoteId(restaurant.id);
    setEditingText(restaurant.notes || '');
  };

  const handleSaveNote = (restaurantId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateNote(restaurantId, editingText);
    setEditingNoteId(null);
  };

  if (favorites.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-stone-200/90 p-8 sm:p-12 text-center max-w-lg mx-auto shadow-xs">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-500 mx-auto flex items-center justify-center mb-4 border border-rose-100">
          <Heart className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-stone-900 mb-2">
          No tienes restaurantes favoritos guardados
        </h3>
        <p className="text-sm text-stone-500 mb-6 leading-relaxed">
          Explora los restaurantes cercanos y pulsa el icono de corazón en cualquier restaurante para guardarlo en tu lista personal.
        </p>
        <button
          onClick={onExploreClick}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-sm transition-colors"
        >
          <Utensils className="w-4 h-4" />
          <span>Explorar restaurantes cercanos</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top Header of Favorites */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
            <span>Tus Restaurantes Favoritos ({favorites.length})</span>
          </h2>
          <p className="text-xs text-stone-500">
            Guardados en este dispositivo para acceso rápido y sin conexión
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Quick filter in favorites */}
          <div className="relative flex-1 sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar en favoritos..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-amber-500"
            />
          </div>

          <button
            onClick={() => {
              if (
                window.confirm(
                  '¿Estás seguro de que quieres vaciar toda tu lista de favoritos?'
                )
              ) {
                onClearFavorites();
              }
            }}
            className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            title="Borrar todos los favoritos"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid / List of Favorites */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredFavorites.map((restaurant) => (
          <div
            key={restaurant.id}
            onClick={() => onSelectRestaurant(restaurant)}
            className="group bg-white rounded-2xl border border-stone-200/90 shadow-xs hover:shadow-md hover:border-amber-300 transition-all p-4 cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start gap-3.5">
                <RestaurantPhoto restaurant={restaurant} className="w-20 h-20 rounded-xl shrink-0 border border-stone-100" />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                      {restaurant.primaryType || 'Restaurante'}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveFavorite(restaurant.id);
                      }}
                      className="text-stone-400 hover:text-rose-600 p-1 rounded-full transition-colors"
                      title="Eliminar de favoritos"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <h3 className="font-bold text-stone-900 text-base group-hover:text-amber-600 transition-colors truncate mt-1">
                    {restaurant.name}
                  </h3>

                  <div className="flex items-center gap-2 mt-0.5 text-xs text-stone-500">
                    <div className="flex items-center gap-1 font-semibold text-amber-600">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                      <span>{restaurant.rating?.toFixed(1) || '4.5'}</span>
                    </div>
                    {restaurant.distanceMeters !== undefined && (
                      <>
                        <span>•</span>
                        <span>a {formatDistance(restaurant.distanceMeters)}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Address */}
              <p className="text-xs text-stone-500 line-clamp-1 mt-3">
                {restaurant.address}
              </p>

              {/* Personal Notes Section */}
              <div className="mt-2.5 pt-2 border-t border-stone-100">
                {editingNoteId === restaurant.id ? (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="space-y-1.5"
                  >
                    <input
                      type="text"
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      placeholder="Escribe tu nota personal..."
                      className="w-full text-xs p-2 bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:border-amber-500"
                      autoFocus
                    />
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingNoteId(null);
                        }}
                        className="px-2 py-1 text-[11px] text-stone-500 hover:text-stone-800"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={(e) => handleSaveNote(restaurant.id, e)}
                        className="px-2.5 py-1 text-[11px] font-semibold bg-amber-500 hover:bg-amber-600 text-white rounded-md"
                      >
                        Guardar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={(e) => handleStartEditNote(restaurant, e)}
                    className="flex items-center justify-between text-xs text-stone-600 hover:text-stone-900 bg-amber-50/50 hover:bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-100 transition-colors"
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <FileEdit className="w-3 h-3 text-amber-600 shrink-0" />
                      <span className="truncate italic">
                        {restaurant.notes
                          ? `"${restaurant.notes}"`
                          : 'Añadir nota personal (ej: plato favorito)...'}
                      </span>
                    </div>
                    <span className="text-[10px] font-semibold text-amber-700 shrink-0 ml-1">
                      {restaurant.notes ? 'Editar' : '+ Nota'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions Footer */}
            <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between gap-2">
              <a
                href={getDirectionsUrl(restaurant.location, restaurant.name)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-stone-100 hover:bg-amber-500 hover:text-white text-stone-700 transition-colors"
              >
                <Navigation className="w-3 h-3" />
                <span>Cómo llegar</span>
              </a>

              {restaurant.phoneNumber && (
                <a
                  href={`tel:${restaurant.phoneNumber}`}
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-stone-600 hover:text-emerald-700 transition-colors"
                >
                  <Phone className="w-3 h-3 text-emerald-600" />
                  <span>{restaurant.phoneNumber}</span>
                </a>
              )}

              <span className="text-xs font-semibold text-amber-600">
                Ver detalles →
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

