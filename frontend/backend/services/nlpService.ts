export function parseSearchQuery(query: string) {
  if (query.includes('under')) {
    const parts = query.split('under');
    return { keyword: parts[0].trim(), maxPrice: parseInt(parts[1].trim()) };
  }
  return { keyword: query };
}
