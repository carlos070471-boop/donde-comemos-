import React from 'react';
import { UtensilsCrossed, Heart, MapPin, Map, List, Navigation } from 'lucide-react';

interface HeaderProps {
  activeTab: 'list' | 'map' | 'favorites';
  setActiveTab: (tab: 'list' | 'map' | 'favorites') => void;
  favoritesCount: number;
  locationLabel: string;
  isLocating: boolean;
  onRefreshLocation: () => void;
  onChangeLocationClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  favoritesCount,
  locationLabel,
  isLocating,
  onRefreshLocation,
  onChangeLocationClick,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-xs pt-[38px]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-lg sm:text-xl text-stone-900 leading-tight">
                Dónde comemos
              </h1>
              <p className="text-xs text-stone-500 hidden sm:block">
                Encuentra gastronomía a tu alrededor
              </p>
            </div>
          </div>

          {/* Location Badge */}
          <div className="flex items-center gap-2">
            <button
              onClick={onChangeLocationClick}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-full transition-colors border border-stone-200/80 max-w-[160px] sm:max-w-[240px] truncate"
              title="Cambiar ubicación"
            >
              <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span className="truncate">{locationLabel}</span>
            </button>

            <button
              onClick={onRefreshLocation}
              disabled={isLocating}
              className="p-1.5 text-stone-500 hover:text-amber-600 hover:bg-stone-100 rounded-full transition-colors disabled:opacity-50"
              title="Actualizar mi ubicación GPS"
            >
              <Navigation className={`w-4 h-4 ${isLocating ? 'animate-spin text-amber-500' : ''}`} />
            </button>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-1 sm:gap-2">
            <nav className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200/70">
              <button onClick={() => setActiveTab('list')} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-all ${activeTab === 'list' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'}`}>
                <List className="w-4 h-4" /><span className="hidden sm:inline">Lista</span>
              </button>
              <button onClick={() => setActiveTab('map')} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-all ${activeTab === 'map' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'}`}>
                <Map className="w-4 h-4" /><span className="hidden sm:inline">Mapa</span>
              </button>
              <button onClick={() => setActiveTab('favorites')} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-all relative ${activeTab === 'favorites' ? 'bg-amber-500 text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'}`}>
                <Heart className={`w-4 h-4 ${activeTab === 'favorites' ? 'fill-white text-white' : favoritesCount > 0 ? 'text-rose-500 fill-rose-500' : ''}`} />
                <span className="hidden sm:inline">Favoritos</span>
                {favoritesCount > 0 && <span className={`inline-flex items-center justify-center text-[10px] font-bold px-1.5 py-0.2 rounded-full min-w-4 text-center ${activeTab === 'favorites' ? 'bg-white text-amber-600' : 'bg-rose-500 text-white'}`}>{favoritesCount}</span>}
              </button>
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
};
