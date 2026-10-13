import React, { useState } from 'react';
import { MapPin, Navigation, X, Check, Search } from 'lucide-react';
import { Coordinates } from '../types/restaurant';

interface LocationPromptProps {
  isOpen: boolean;
  onClose: () => void;
  currentCoords: Coordinates;
  onSelectCoords: (coords: Coordinates, label: string) => void;
  onRequestBrowserLocation: () => void;
  isLocating: boolean;
}

const POPULAR_LOCATIONS = [
  { name: 'Madrid (Centro)', lat: 40.4168, lng: -3.7038 },
  { name: 'Barcelona (Eixample)', lat: 41.3879, lng: 2.1699 },
  { name: 'Sevilla (Santa Cruz)', lat: 37.3891, lng: -5.9845 },
  { name: 'Valencia (Ruzafa)', lat: 39.4699, lng: -0.3763 },
  { name: 'Ciudad de México (Roma)', lat: 19.4194, lng: -99.1628 },
  { name: 'Buenos Aires (Palermo)', lat: -34.5885, lng: -58.4306 },
  { name: 'Bogotá (Zona G)', lat: 4.6548, lng: -74.0561 },
  { name: 'Santiago (Providencia)', lat: -33.4262, lng: -70.6125 },
];

export const LocationPrompt: React.FC<LocationPromptProps> = ({
  isOpen,
  onClose,
  currentCoords,
  onSelectCoords,
  onRequestBrowserLocation,
  isLocating,
}) => {
  const [customCitySearch, setCustomCitySearch] = useState('');
  const [isSearchingCity, setIsSearchingCity] = useState(false);
  const [searchError, setSearchError] = useState('');

  if (!isOpen) return null;

  const handleSearchCity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customCitySearch.trim()) return;

    setIsSearchingCity(true);
    setSearchError('');

    try {
      // Using open-access Nominatim or Google Geocoder for city search
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          customCitySearch
        )}&limit=1`
      );
      const data = await res.json();
      if (data && data.length > 0) {
        const item = data[0];
        onSelectCoords(
          { lat: parseFloat(item.lat), lng: parseFloat(item.lon) },
          item.display_name.split(',')[0]
        );
        onClose();
      } else {
        setSearchError('No se encontró esa ubicación. Prueba con otra ciudad.');
      }
    } catch {
      setSearchError('Error de conexión al buscar ciudad.');
    } finally {
      setIsSearchingCity(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden z-10 border border-stone-200 p-6 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-stone-900">
                Cambiar tu ubicación
              </h3>
              <p className="text-xs text-stone-500">
                Ver restaurantes alrededor de cualquier lugar
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Browser Geolocation Button */}
        <div>
          <button
            onClick={() => {
              onRequestBrowserLocation();
              onClose();
            }}
            disabled={isLocating}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-xs transition-colors"
          >
            <Navigation
              className={`w-4 h-4 ${isLocating ? 'animate-spin' : ''}`}
            />
            <span>
              {isLocating
                ? 'Obteniendo tu señal GPS...'
                : 'Usar mi ubicación GPS actual'}
            </span>
          </button>
          <p className="text-[11px] text-stone-400 text-center mt-1.5">
            El navegador solicitará permiso para acceder a tu ubicación exacta.
          </p>
        </div>

        {/* City Search */}
        <form onSubmit={handleSearchCity} className="space-y-1">
          <span className="text-xs font-semibold text-stone-700 block">
            O busca cualquier ciudad o barrio:
          </span>
          <div className="relative flex items-center">
            <Search className="absolute left-3 w-4 h-4 text-stone-400" />
            <input
              type="text"
              value={customCitySearch}
              onChange={(e) => setCustomCitySearch(e.target.value)}
              placeholder="Ej: Madrid, Valencia, Bogotá..."
              className="w-full pl-9 pr-20 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-stone-800"
            />
            <button
              type="submit"
              disabled={isSearchingCity || !customCitySearch.trim()}
              className="absolute right-1.5 px-3 py-1 bg-stone-900 hover:bg-black disabled:opacity-50 text-white text-[11px] font-semibold rounded-lg transition-colors"
            >
              {isSearchingCity ? 'Buscando...' : 'Buscar'}
            </button>
          </div>
          {searchError && (
            <p className="text-[11px] text-rose-600 mt-1">{searchError}</p>
          )}
        </form>

        {/* Popular Predefined Locations */}
        <div>
          <span className="text-xs font-semibold text-stone-700 block mb-2">
            Ciudades populares para explorar:
          </span>
          <div className="grid grid-cols-2 gap-2">
            {POPULAR_LOCATIONS.map((loc) => {
              const isSelected =
                Math.abs(currentCoords.lat - loc.lat) < 0.01 &&
                Math.abs(currentCoords.lng - loc.lng) < 0.01;

              return (
                <button
                  key={loc.name}
                  onClick={() => {
                    onSelectCoords(
                      { lat: loc.lat, lng: loc.lng },
                      loc.name.split(' ')[0]
                    );
                    onClose();
                  }}
                  className={`flex items-center justify-between p-2.5 rounded-xl text-xs font-medium border text-left transition-colors ${
                    isSelected
                      ? 'bg-amber-50 border-amber-300 text-amber-900 font-semibold'
                      : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100 hover:border-stone-300'
                  }`}
                >
                  <span className="truncate">{loc.name}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
