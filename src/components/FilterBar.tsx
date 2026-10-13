import React from 'react';
import { Search, SlidersHorizontal, Compass, Clock, Star } from 'lucide-react';
import { FilterOptions, SortOption } from '../types/restaurant';

interface FilterBarProps {
  filters: FilterOptions;
  setFilters: React.Dispatch<React.SetStateAction<FilterOptions>>;
  totalResults: number;
}

const CATEGORIES = [
  { id: 'all', label: 'Todos' },
  { id: 'tapas', label: 'Tapas & Bar' },
  { id: 'italian', label: 'Italiano & Pizza' },
  { id: 'cafe', label: 'Cafeterías & Brunch' },
  { id: 'asian', label: 'Asiático & Sushi' },
  { id: 'burger', label: 'Hamburguesas' },
  { id: 'seafood', label: 'Mariscos' },
  { id: 'healthy', label: 'Vegetariano' },
];

const RADIUS_OPTIONS = [
  { value: 500, label: '500 m' },
  { value: 1000, label: '1 km' },
  { value: 2500, label: '2.5 km' },
  { value: 5000, label: '5 km' },
];

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  setFilters,
  totalResults,
}) => {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-xs border border-stone-200/80 mb-6 space-y-4">
      {/* Top search & sorting row */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, searchQuery: e.target.value }))
            }
            placeholder="Buscar por nombre, tipo de comida, calle..."
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all placeholder:text-stone-400"
          />
          {filters.searchQuery && (
            <button
              onClick={() => setFilters((prev) => ({ ...prev, searchQuery: '' }))}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-stone-600 bg-stone-200/60 rounded-full w-5 h-5 flex items-center justify-center"
            >
              ✕
            </button>
          )}
        </div>

        {/* Sort & Quick Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <div className="flex items-center gap-1.5 text-xs text-stone-500 bg-stone-50 px-3 py-2 border border-stone-200 rounded-xl shrink-0">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <select
              value={filters.sortBy}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  sortBy: e.target.value as SortOption,
                }))
              }
              aria-label="Ordenar restaurantes por"
              className="bg-transparent font-medium text-stone-700 outline-none cursor-pointer"
            >
              <option value="distance">Más cercanos</option>
              <option value="rating">Mejor valorados</option>
              <option value="reviews">Más opiniones</option>
            </select>
          </div>

          {/* Open Now toggle button */}
          <button
            onClick={() =>
              setFilters((prev) => ({
                ...prev,
                onlyOpenNow: !prev.onlyOpenNow,
              }))
            }
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-colors shrink-0 ${
              filters.onlyOpenNow
                ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Abierto ahora</span>
          </button>
        </div>
      </div>

      {/* Category Pills & Radius Filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1 border-t border-stone-100">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto py-1 no-scrollbar">
          {CATEGORIES.map((cat) => {
            const isSelected = filters.selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    selectedCategory: cat.id,
                  }))
                }
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-amber-500 text-white shadow-xs font-semibold'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-900'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Distance Radius */}
        <div className="flex items-center gap-1.5 text-xs text-stone-500 shrink-0 self-end sm:self-auto">
          <Compass className="w-3.5 h-3.5 text-stone-400" />
          <span>Radio:</span>
          <div className="flex items-center bg-stone-100 p-0.5 rounded-lg border border-stone-200/60">
            {RADIUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    maxDistanceMeters: opt.value,
                  }))
                }
                className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors ${
                  filters.maxDistanceMeters === opt.value
                    ? 'bg-white text-stone-900 shadow-2xs font-semibold'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
