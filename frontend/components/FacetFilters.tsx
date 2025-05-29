'use client';
import { useState, useEffect } from 'react';

interface FacetValue {
  value: string | number;
  count?: number;
}

interface Facets {
  priceRange: { min: number; max: number };
  [key: string]: FacetValue[] | { min: number; max: number };
}

interface FacetFiltersProps {
  facets: Facets;
  selectedFilters: Record<string, FacetValue[]>;
  setSelectedFilters: (
    filters:
      | Record<string, FacetValue[]>
      | ((prev: Record<string, FacetValue[]>) => Record<string, FacetValue[]>),
  ) => void;
  onFilterChange: (filters: Record<string, FacetValue[]>) => void;
  onSearch: () => void;
  isLoading: boolean;
}

export default function FacetFilters({
  facets,
  selectedFilters,
  setSelectedFilters,
  onFilterChange,
  onSearch,
  isLoading,
}: FacetFiltersProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleFilterChange = async (facetKey: string, value: FacetValue) => {
    setSelectedFilters((prev: Record<string, FacetValue[]>) => {
      const newFilters = { ...prev };
      if (!newFilters[facetKey]) {
        newFilters[facetKey] = [];
      }

      // Check if the value already exists in the array
      const valueExists = newFilters[facetKey].some(
        (item: FacetValue) => item.value === value.value,
      );

      if (!valueExists) {
        // Add the value if it doesn't exist
        newFilters[facetKey] = [...newFilters[facetKey], value];
      } else {
        // Remove the value if it exists
        newFilters[facetKey] = newFilters[facetKey].filter(
          (item: FacetValue) => item.value !== value.value,
        );
      }

      // Clean up empty arrays
      if (newFilters[facetKey].length === 0) {
        delete newFilters[facetKey];
      }

      onFilterChange(newFilters);
      return newFilters;
    });
  };

  if (isLoading) {
    return <div className="border p-4 rounded shadow">Loading facets...</div>;
  }

  if (!facets) {
    return null;
  }

  return (
    <div className="border p-4 rounded shadow">
      <h3 className="text-lg font-bold mb-4">
        Filters {isLoading && <span className="text-sm text-gray-500">(Loading...)</span>}
      </h3>

      {Object.entries(facets).map(([key, values]) => {
        if (!Array.isArray(values) || values.length === 0) return null;
        if (key === 'priceRange') {
          const priceRange = values as unknown as { min: number; max: number };
          const { min, max } = priceRange;
          return (
            <div key={key} className="mb-4">
              <h4 className="font-semibold mb-2">Price Range</h4>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={min}
                  max={max}
                  className="w-full"
                  onChange={(e) =>
                    handleFilterChange('price', { value: Number(e.target.value) } as FacetValue)
                  }
                />
                <span>{min}</span>
                <span>{max}</span>
              </div>
            </div>
          );
        }
        return (
          <div key={key} className="mb-4">
            <h4 className="font-semibold mb-2">{key.charAt(0).toUpperCase() + key.slice(1)}</h4>
            <div className="space-y-2">
              {values.map((value: FacetValue, index: number) => {
                const isChecked =
                  selectedFilters[key]?.some((v) => v.value === value.value) || false;
                return (
                  <label key={`${key}-${value.value}-${index}`} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleFilterChange(key, value)}
                      className="rounded"
                    />
                    <span>{String(value.value)}</span>
                  </label>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
