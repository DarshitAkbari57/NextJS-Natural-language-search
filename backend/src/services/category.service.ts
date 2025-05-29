import mongoose from 'mongoose';
import { Category, ICategory } from '../models/Category';

export class CategoryService {
  async createCategory(data: Partial<ICategory>) {
    const category = new Category(data);
    return await category.save();
  }

  async getAllCategories() {
    return await Category.find().sort({ name: 1 });
  }

  async getCategoryBySlug(slug: string) {
    return await Category.findOne({ slug });
  }

  async getCategoryById(id: string) {
    return await Category.findById(id);
  }

  async updateCategory(id: string, data: Partial<ICategory>) {
    return await Category.findByIdAndUpdate(id, { $set: data }, { new: true });
  }

  async deleteCategory(id: string) {
    return await Category.findByIdAndDelete(id);
  }

  async validateCategoryExists(id: string) {
    const category = await this.getCategoryById(id);
    if (!category) {
      throw new Error('Category not found');
    }
    return category;
  }
}
