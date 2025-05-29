interface SearchParams {
  query: string;
  filters?: Record<string, any[]>;
}

export const searchProducts = async ({ query, filters }: SearchParams) => {
  const res = await fetch('/api/products/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      filters,
    }),
  });

  if (!res.ok) {
    throw new Error('Search failed');
  }
  return res.json();
};
