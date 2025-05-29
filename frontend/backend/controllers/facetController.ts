import { NextApiRequest, NextApiResponse } from 'next';
import { Product } from '@/backend/models/Product';

export async function getFacets(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Get all unique values for each facet field
    const facets = await Product.aggregate([
      {
        $facet: {
          category: [{ $group: { _id: '$category', count: { $sum: 1 } } }],
          subcategory: [{ $group: { _id: '$subcategory', count: { $sum: 1 } } }],
          'location.city': [{ $group: { _id: '$location.city', count: { $sum: 1 } } }],
          priceRange: [
            {
              $group: {
                _id: null,
                min: { $min: '$price' },
                max: { $max: '$price' },
              },
            },
          ],
        },
      },
    ]);

    // Transform the data into the required format
    const formattedFacets = {
      category: facets[0].category.map((item: any) => ({
        value: item._id,
        count: item.count,
      })),
      subcategory: facets[0].subcategory.map((item: any) => ({
        value: item._id,
        count: item.count,
      })),
      'location.city': facets[0]['location.city'].map((item: any) => ({
        value: item._id,
        count: item.count,
      })),
      priceRange: facets[0].priceRange[0] || { min: 0, max: 0 },
    };

    res.status(200).json(formattedFacets);
  } catch (error) {
    console.error('Error fetching facets:', error);
    res.status(500).json({ error: 'Error fetching facets' });
  }
}
