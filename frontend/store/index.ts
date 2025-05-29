import { configureStore } from '@reduxjs/toolkit';
import searchReducer from './searchSlice';
import { Product } from '@/types';

export const store = configureStore({
  reducer: {
    search: searchReducer,
  },
});

export type RootState = {
  search: {
    products: Product[];
    facets: any;
    query: string;
    isLoading: boolean;
    error: string | null;
  };
};

export type AppDispatch = typeof store.dispatch;
