'use client';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setQuery, performSearch } from '../store/searchSlice';
import type { RootState, AppDispatch } from '../store';

interface SearchBarProps {
  queryString: string;
  onSearch: () => void;
  clearFilters: () => void;
  setQueryString: (query: string) => void;
}

export default function SearchBar({ queryString, onSearch, setQueryString }: SearchBarProps) {
  const { clearFilters, query, isLoading } = useSelector((state: RootState) => state.search);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSearch();
    }
  };

  return (
    <div className="mb-4">
      <div className="relative">
        <input
          type="text"
          className="border rounded p-2 w-full text-black pr-24"
          placeholder="Search products... (e.g., organic NPK fertilizers in Thrissur under ₹500/kg)"
          onChange={(e) => {
            setQueryString(e.target.value);
          }}
          onKeyPress={handleKeyPress}
        />
        {queryString && (
          <button
            onClick={onSearch}
            disabled={isLoading}
            className="absolute right-[100px] top-1/2 transform -translate-y-1/2 bg-gray-500 text-white px-4 py-1 rounded"
          >
            Clear
          </button>
        )}
        <button
          onClick={onSearch}
          disabled={isLoading}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600 disabled:bg-blue-300"
        >
          {isLoading ? 'Searching...' : 'Search'}
        </button>
      </div>
    </div>
  );
}
