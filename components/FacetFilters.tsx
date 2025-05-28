'use client';
import { useState, useEffect } from 'react';

interface FacetFiltersProps {
  facets: any;
  onFilterChange: (filters: any) => void;
}

export default function FacetFilters({ facets, onFilterChange }: FacetFiltersProps) {
  const [selectedFilters, setSelectedFilters] = useState<Record<string, any[]>>({});
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleFilterChange = (facetKey: string, value: any) => {
    setSelectedFilters((prev) => {
      const newFilters = { ...prev };
      if (!newFilters[facetKey]) {
        newFilters[facetKey] = [];
      }

      const index = newFilters[facetKey].indexOf(value);
      if (index === -1) {
        newFilters[facetKey].push(value);
      } else {
        newFilters[facetKey].splice(index, 1);
      }

      if (newFilters[facetKey].length === 0) {
        delete newFilters[facetKey];
      }

      onFilterChange(newFilters);
      return newFilters;
    });
  };

  if (!isMounted || !facets) return null;

  return (
    <div className="border p-4 rounded shadow">
      <h3 className="text-lg font-bold mb-4">Filters</h3>

      {Object.entries(facets).map(([key, values]) => {
        if (!Array.isArray(values) || values.length === 0) return null;
        if (key === 'priceRange') {
          const { min, max } = values as { min: number; max: number };
          return (
            <div key={key} className="mb-4">
              <h4 className="font-semibold mb-2">Price Range</h4>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={min}
                  max={max}
                  className="w-full"
                  onChange={(e) => handleFilterChange('price', Number(e.target.value))}
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
              {values.map((value: any, index: number) => {
                return (
                  <label key={`${key}-${value}-${index}`} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedFilters[key]?.includes(value) || false}
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
