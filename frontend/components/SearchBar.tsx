'use client';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';

interface SearchBarProps {
  queryString: string;
  selectedFilters: Record<string, any>;
  onSearch: () => void;
  clearFilters: () => void;
  setQueryString: (query: string) => void;
}

export default function SearchBar({
  queryString,
  selectedFilters,
  onSearch,
  clearFilters,
  setQueryString,
}: SearchBarProps) {
  const { isLoading } = useSelector((state: RootState) => state.search);
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
          value={queryString}
          onChange={(e) => {
            setQueryString(e.target.value);
          }}
          onKeyPress={handleKeyPress}
        />
        {(queryString || Object.keys(selectedFilters).length > 0) && (
          <button
            onClick={clearFilters}
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
