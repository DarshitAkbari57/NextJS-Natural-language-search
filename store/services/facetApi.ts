export const getFacets = async () => {
  const res = await fetch('/api/facets');
  if (!res.ok) {
    throw new Error('Failed to fetch facets');
  }
  return res.json();
};
