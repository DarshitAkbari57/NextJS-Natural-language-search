import { configureStore } from '@reduxjs/toolkit';
import searchReducer from './searchSlice';

export const store = configureStore({
  reducer: {
    search: searchReducer,
  },
});

export type RootState = {
  search: {
    products: any[];
    facets: any;
    query: string;
    isLoading: boolean;
    error: string | null;
  };
};

export type AppDispatch = typeof store.dispatch;
