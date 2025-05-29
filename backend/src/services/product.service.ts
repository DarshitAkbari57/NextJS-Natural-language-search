import { Product } from '../models/Product';
import { Category, ICategory } from '../models/Category';
import mongoose, { Document, Types, HydratedDocument } from 'mongoose';

interface AttributeStats {
  count: number;
  confidence: number;
}

type CategoryDocument = Document<unknown, {}, ICategory> & ICategory;
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

export class ProductService {
  async getFacetsForResults(products: any[]) {
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

  async getProducts(query: any) {
    return await Product.find(query).lean();
  }

  async createProduct(data: Partial<typeof Product>) {
    const product = new Product(data);
    return await product.save();
  }

  async getAllProducts({ page = 1, limit = 10 }: { page: number; limit: number }) {
    const skip = (page - 1) * limit;
    const [products, total] = await Promise.all([
      Product.find().skip(skip).limit(limit).populate('categoryId', 'name slug'),
      Product.countDocuments(),
    ]);

    return {
      products,
      total,
      page,
      limit,
    };
  }

  async getProductById(id: string) {
    return await Product.findById(id).populate('categoryId', 'name slug');
  }

  async updateProduct(id: string, data: Partial<typeof Product>) {
    return await Product.findByIdAndUpdate(id, { $set: data }, { new: true }).populate(
      'categoryId',
      'name slug',
    );
  }

  async deleteProduct(id: string) {
    return await Product.findByIdAndDelete(id);
  }
}
