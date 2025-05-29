import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { searchProducts } from './services/searchApi';
import { getFacets } from './services/facetApi';
import { Product } from '@/types';

interface FacetValue {
  value: string | number;
  count?: number;
}

interface SearchState {
  products: Product[];
  facets: any;
  query: string;
  isLoading: boolean;
  error: string | null;
  selectedFilters: Record<string, FacetValue[]>;
}

const initialState: SearchState = {
  products: [],
  facets: null,
  query: '',
  isLoading: false,
  error: null,
  selectedFilters: {},
};

export const performSearch = createAsyncThunk(
  'search/performSearch',
  async (params: { query: string; filters?: Record<string, FacetValue[]> }) => {
    const response = await searchProducts(params);
    return response;
  },
);

export const fetchFacets = createAsyncThunk('search/fetchFacets', async () => {
  const response = await getFacets();
  return response;
});

const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    setQuery: (state, action) => {
      state.query = action.payload;
    },
    setFilters: (state, action) => {
      state.selectedFilters = action.payload;
    },
    clearSearch: (state) => {
      state.products = [];
      state.facets = null;
      state.query = '';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(performSearch.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(performSearch.fulfilled, (state, action) => {
        state.isLoading = false;
        state.products = action.payload.products;
        state.facets = action.payload.facets;
      })
      .addCase(performSearch.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'An error occurred';
      })
      .addCase(fetchFacets.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchFacets.fulfilled, (state, action) => {
        state.isLoading = false;
        state.facets = action.payload;
      })
      .addCase(fetchFacets.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Error fetching facets';
      });
  },
});

export const { setQuery, setFilters, clearSearch } = searchSlice.actions;
export default searchSlice.reducer;
