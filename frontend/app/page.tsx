'use client';
import { useCallback, useState, useEffect } from 'react';
import SearchBar from '../components/SearchBar';
import FacetFilters from '../components/FacetFilters';
import { performSearch, setFilters, setQuery, fetchFacets } from '@/store/searchSlice';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store';

export default function Home() {
  const dispatch = useDispatch<AppDispatch>();
  const { products, facets, isLoading } = useSelector((state: RootState) => state.search);
  const [queryString, setQueryString] = useState<string>('');
  const [selectedFilters, setSelectedFilters] = useState<Record<string, any[]>>({});

  // Fetch facets on component mount
  useEffect(() => {
    dispatch(fetchFacets());
  }, [dispatch]);

  const handleSearch = useCallback(
    (data = { query: queryString, filters: selectedFilters }) => {
      dispatch(setQuery(queryString));
      dispatch(performSearch(data));
    },
    [queryString, selectedFilters, dispatch],
  );

  useEffect(() => {
    handleSearch({ query: queryString, filters: selectedFilters });
  }, [queryString, selectedFilters, handleSearch]);

  const handleFilterChange = useCallback((filters: any) => {
    setSelectedFilters(filters);
  }, []);

  const clearFilters = useCallback(() => {
    setSelectedFilters({});
    setQueryString('');
    dispatch(setQuery(''));
    dispatch(setFilters({}));
  }, []);

  return (
    <main className="p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">B2B Marketplace Search</h1>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-1">
            <FacetFilters
              selectedFilters={selectedFilters}
              setSelectedFilters={setSelectedFilters}
              facets={facets}
              onFilterChange={handleFilterChange}
              onSearch={handleSearch}
              isLoading={isLoading}
            />
          </div>
          <div className="md:col-span-3">
            <SearchBar
              queryString={queryString}
              selectedFilters={selectedFilters}
              onSearch={handleSearch}
              setQueryString={setQueryString}
              clearFilters={clearFilters}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product) => (
                <div key={product._id} className="border p-4 rounded shadow">
                  <h3 className="font-bold">{product.name}</h3>
                  <p className="text-gray-600">
                    ₹{product.price}/{product.priceUnit}
                  </p>
                  <p className="text-sm">{product.location?.city}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
