interface SearchParams {
  query?: string;
  category?: string;
  filters?: Record<string, any>;
  page?: number;
  limit?: number;
}

export const searchProducts = async ({ query, filters, page = 1, limit = 10 }: SearchParams) => {
  console.log('checkkck query: ', query, filters);
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/products/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: query,
      filters: filters,
      page: page,
      limit: limit,
    }),
  });

  if (!res.ok) {
    throw new Error('Search failed');
  }
  return res.json();
};
