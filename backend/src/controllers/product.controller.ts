import { Request, Response, NextFunction } from 'express';
import { ProductService } from '../services/product.service';
import { logger } from '../utils/logger';
import { AppError } from '../middlewares/error.middleware';
import { parseNaturalLanguageQuery } from '../utils/nlpProcessor';

const productService = new ProductService();
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

export class ProductController {
  async search(req: Request, res: Response, next: NextFunction) {
    const { query, filters } = req.body;

    try {
      const intent = await parseNaturalLanguageQuery(query);
      let searchQuery: any = {};
      if (intent.remainingQuery && intent.remainingQuery.trim()) {
        searchQuery.$or = [
          { name: { $regex: intent.remainingQuery, $options: 'i' } },
          { category: { $regex: intent.remainingQuery, $options: 'i' } },
          { subcategory: { $regex: intent.remainingQuery, $options: 'i' } },
        ];
      }
      if (intent.productType && intent.confidence.productType >= 0.7) {
        const terms = intent.productType.split(/\s+/);
        const termConditions = terms.map((term) => ({
          $or: [
            { category: { $regex: term, $options: 'i' } },
            { subcategory: { $regex: term, $options: 'i' } },
          ],
        }));
        searchQuery.$and = [...(searchQuery.$and || []), ...termConditions];
      }
      if (intent.location && intent.confidence.location >= 0.7) {
        searchQuery.$or = [
          // { name: { $regex: query, $options: 'i' } },
          // { category: { $regex: query, $options: 'i' } },
          // { subcategory: { $regex: query, $options: 'i' } },
          { 'location.city': { $regex: intent.location, $options: 'i' } },
          { 'location.state': { $regex: intent.location, $options: 'i' } },
          { 'location.country': { $regex: intent.location, $options: 'i' } },
        ];
      }
      if (intent.productType && intent.confidence.productType >= 0.7) {
        const terms = intent.productType.split(/\s+/);
        const termConditions = terms.map((term) => ({
          $or: [
            { category: { $regex: term, $options: 'i' } },
            { subcategory: { $regex: term, $options: 'i' } },
          ],
        }));
        searchQuery.$and = [...(searchQuery.$and || []), ...termConditions];
      }
      if (intent.priceRange && intent.confidence.priceRange >= 0.7) {
        if (intent.priceRange.max) {
          searchQuery.price = { ...searchQuery.price, $lte: intent.priceRange.max };
        }
        if (intent.priceRange.min) {
          searchQuery.price = { ...searchQuery.price, $gte: intent.priceRange.min };
        }
      }
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

      searchQuery.$and = [...(searchQuery.$and || []), { $or: [] }];
      if (filters) {
        const queryLength = searchQuery.$and.length;
        Object.entries(filters).forEach(([key, values]) => {
          if (Array.isArray(values) && values.length > 0) {
            if (key === 'locations') {
              const locationConditions = [
                { 'location.city': { $in: values.map((v) => v.value) } },
                { 'location.state': { $in: values.map((v) => v.value) } },
                { 'location.country': { $in: values.map((v) => v.value) } },
              ];

              searchQuery.$and[queryLength - 1] = { $or: locationConditions };
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

      const products = await productService.getProducts(searchQuery);

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

      const facets = await productService.getFacetsForResults(productsWithConfidence);
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
      res.status(500).json({
        error: 'Error performing search',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const listing = await productService.createProduct(req.body);
      res.status(201).json(listing);
    } catch (error) {
      next(error);
    }
  }

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const products = await productService.getAllProducts({
        page: Number(page),
        limit: Number(limit),
      });
      res.json(products);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const listing = await productService.getProductById(req.params.id);
      if (!listing) {
        throw new AppError(404, 'Listing not found');
      }
      res.json(listing);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const listing = await productService.updateProduct(req.params.id, req.body);
      if (!listing) {
        throw new AppError(404, 'Listing not found');
      }
      res.json(listing);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await productService.deleteProduct(req.params.id);
      if (!result) {
        throw new AppError(404, 'Listing not found');
      }
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}
