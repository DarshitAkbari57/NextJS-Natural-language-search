'use client';
import { useState } from 'react';
import SearchBar from '../components/SearchBar';
import FacetFilters from '../components/FacetFilters';

export default function Home() {
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [facets, setFacets] = useState<any>(null);

  const handleSearch = (results: any[], newFacets: any) => {
    setSearchResults(results);
    setFacets(newFacets);
  };

  return (
    <main className="p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">B2B Marketplace Search</h1>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-1">
            <FacetFilters facets={facets} onFilterChange={() => {}} />
          </div>
          <div className="md:col-span-3">
            <SearchBar onSearch={handleSearch} />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {searchResults.map((product) => (
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
