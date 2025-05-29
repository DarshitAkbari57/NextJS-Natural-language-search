import { Request, Response, NextFunction } from 'express';
import { CategoryService } from '../services/category.service';
import { AppError } from '../middlewares/error.middleware';
import { logger } from '../utils/logger';

const categoryService = new CategoryService();

export class CategoryController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const category = await categoryService.createCategory(req.body);
      res.status(201).json(category);
    } catch (error) {
      next(error);
    }
  }

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await categoryService.getAllCategories();
      res.json(categories);
    } catch (error) {
      next(error);
    }
  }

  async getBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const category = await categoryService.getCategoryBySlug(req.params.slug);
      if (!category) {
        throw new AppError(404, 'Category not found');
      }
      res.json(category);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const category = await categoryService.updateCategory(req.params.id, req.body);
      if (!category) {
        throw new AppError(404, 'Category not found');
      }
      res.json(category);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await categoryService.deleteCategory(req.params.id);
      if (!result) {
        throw new AppError(404, 'Category not found');
      }
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}
