import { NextApiRequest, NextApiResponse } from 'next';
import { Product } from '../models/Product';
import { parseNaturalLanguageQuery } from '../utils/nlpProcessor';

export async function searchProducts(req: NextApiRequest, res: NextApiResponse) {
  const { query, filters } = req.body;

  try {
    const intent = await parseNaturalLanguageQuery(query);
    let searchQuery: any = {};

    // Intent-based search conditions
    if (intent.productType && intent.confidence.productType >= 0.7) {
      const terms = intent.productType.split(/\s+/);
      const termConditions = terms.map((term) => ({
        $or: [
          { category: { $regex: term, $options: 'i' } },
          { subcategory: { $regex: term, $options: 'i' } },
        ],
      }));
      searchQuery.$and = termConditions;
    }

    if (intent.location && intent.confidence.location >= 0.7) {
      searchQuery.$or = [
        { 'location.city': { $regex: intent.location, $options: 'i' } },
        { 'location.state': { $regex: intent.location, $options: 'i' } },
        { 'location.country': { $regex: intent.location, $options: 'i' } },
      ];
    }

    if (intent.priceRange && intent.confidence.priceRange >= 0.7) {
      if (intent.priceRange.max) {
        searchQuery.price = { ...searchQuery.price, $lte: intent.priceRange.max };
      }
      if (intent.priceRange.min) {
        searchQuery.price = { ...searchQuery.price, $gte: intent.priceRange.min };
      }
    }

    // Intent filters
    Object.entries(intent.filters).forEach(([key, value]) => {
      if (intent.confidence[key] >= 0.7) {
        if (typeof value === 'string') {
          searchQuery[key] = { $regex: value, $options: 'i' };
        } else if (typeof value === 'number') {
          searchQuery[key] = value;
        } else if (Array.isArray(value)) {
          searchQuery[key] = { $in: value };
        } else {
          searchQuery[key] = value;
        }
      }
    });

    // User-selected filters from request body
    if (filters) {
      Object.entries(filters).forEach(([key, values]) => {
        if (Array.isArray(values) && values.length > 0) {
          if (key === 'locations') {
            // Combine with existing location conditions if any
            const locationConditions = [
              { 'location.city': { $in: values.map((v) => v.value) } },
              { 'location.state': { $in: values.map((v) => v.value) } },
              { 'location.country': { $in: values.map((v) => v.value) } },
            ];

            if (searchQuery.$or) {
              searchQuery.$or = [...searchQuery.$or, ...locationConditions];
            } else {
              searchQuery.$or = locationConditions;
            }
          } else if (typeof values[0] === 'object' && 'value' in values[0]) {
            searchQuery[key] = {
              $in: values.map((v) => v.value),
            };
          } else {
            searchQuery[key] = { $in: values };
          }
        }
      });
    }

    const products = await Product.find(searchQuery).lean();

    const productsWithConfidence = products.map((product) => ({
      ...product,
      _confidence: {
        category: intent.confidence.productType,
        location: intent.confidence.location,
        priceRange: intent.confidence.priceRange,
        ...Object.fromEntries(
          Object.entries(intent.filters)
            .filter(([key]) => product[key] !== undefined)
            .map(([key]) => [key, intent.confidence[key]]),
        ),
      },
    }));

    const facets = await getFacetsForResults(productsWithConfidence);
    res.status(200).json({
      products: productsWithConfidence,
      facets,
      intent,
      metadata: {
        totalResults: productsWithConfidence.length,
        confidenceThreshold: 0.7,
        queryInterpretation: {
          originalQuery: query,
          interpretedAs: {
            productType: intent.productType,
            location: intent.location,
            filters: intent.filters,
          },
          confidence: intent.confidence,
        },
      },
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      error: 'Error performing search',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export async function bulkCreateProducts(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { products } = req.body;

    if (!Array.isArray(products)) {
      return res.status(400).json({ error: 'Products must be an array' });
    }

    const createdProducts = await Product.insertMany(products, { ordered: false });

    res.status(201).json({
      message: `Successfully created ${createdProducts.length} products`,
      products: createdProducts,
    });
  } catch (error) {
    console.error('Bulk create error:', error);
    res.status(400).json({ error: 'Error creating products' });
  }
}

interface FacetConfidence {
  distribution: Record<string, number>;
  average: number;
}

interface Facets {
  confidence: FacetConfidence;
  categories?: Array<{ value: string; confidence: number }>;
  priceRange?: { min: number; max: number; confidence: number };
  locations?: Array<{ value: string; confidence: number }>;
  [key: string]: any;
}

interface AttributeStats {
  count: number;
  confidence: number;
}

async function getFacetsForResults(products: any[]) {
  const facets: Facets = {
    confidence: {
      average: 0,
      distribution: {},
    },
  };

  const confidenceScores = products.map((p) => p._confidence);
  const averageConfidence = confidenceScores.reduce((acc, curr) => {
    Object.entries(curr).forEach(([key, value]) => {
      acc[key] = (acc[key] || 0) + value;
    });
    return acc;
  }, {});

  Object.keys(averageConfidence).forEach((key) => {
    facets.confidence.distribution[key] = averageConfidence[key] / products.length;
  });

  facets.confidence.average =
    Object.values(facets.confidence.distribution as Record<string, number>).reduce(
      (a: number, b: number) => a + b,
      0,
    ) / Object.keys(facets.confidence.distribution).length;

  const categories = [...new Set(products.map((p) => p.category))];
  if (categories.length > 0) {
    facets.categories = categories.map((category) => ({
      value: category,
      confidence:
        products
          .filter((p) => p.category === category)
          .reduce((acc, p) => acc + (p._confidence.category || 0), 0) /
        products.filter((p) => p.category === category).length,
    }));
  }

  const prices = products.map((p) => p.price);
  facets.priceRange = {
    min: Math.min(...prices),
    max: Math.max(...prices),
    confidence:
      products.reduce((acc, p) => acc + (p._confidence.priceRange || 0), 0) / products.length,
  };

  const locations = [...new Set(products.map((p) => p.location?.city))].filter(Boolean);
  if (locations.length > 0) {
    facets.locations = locations.map((location) => ({
      value: location,
      confidence:
        products
          .filter((p) => p.location?.city === location)
          .reduce((acc, p) => acc + (p._confidence.location || 0), 0) /
        products.filter((p) => p.location?.city === location).length,
    }));
  }

  const attributeFacets = new Map();
  products.forEach((product) => {
    if (product.attributes) {
      Object.entries(product.attributes).forEach(([key, value]) => {
        if (!attributeFacets.has(key)) {
          attributeFacets.set(key, new Map());
        }
        const valueMap = attributeFacets.get(key);
        if (!valueMap.has(value)) {
          valueMap.set(value, {
            count: 0,
            confidence: 0,
          });
        }
        valueMap.get(value).count++;
        valueMap.get(value).confidence += product._confidence[key] || 0;
      });
    }
  });

  attributeFacets.forEach((values, key) => {
    facets[key] = Array.from(values.entries()).map((entry) => {
      const [value, stats] = entry as [string, AttributeStats];
      return {
        value,
        count: stats.count,
        confidence: stats.confidence / stats.count,
      };
    });
  });

  const filteredFacets = Object.fromEntries(
    Object.entries(facets).filter(([key]) => !key.startsWith('$__')),
  );

  return filteredFacets;
}

export async function createProduct(req: NextApiRequest, res: NextApiResponse) {
  try {
    const newProduct = new Product(req.body);
    await newProduct.save();
    res.status(201).json(newProduct);
  } catch (error) {
    res.status(400).json({ error: 'Error creating product' });
  }
}

export async function updateProduct(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  try {
    const updated = await Product.findByIdAndUpdate(id, req.body, { new: true });
    res.status(200).json(updated);
  } catch (error) {
    res.status(400).json({ error: 'Error updating product' });
  }
}

export async function deleteProduct(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  try {
    await Product.findByIdAndDelete(id);
    res.status(200).json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: 'Error deleting product' });
  }
}
