import { Router } from 'express';
import { CategoryController } from '../controllers/category.controller';
import { validate } from '../middlewares/validate';
import { createCategorySchema, updateCategorySchema } from '../validations/category.validation';

const router = Router();
const categoryController = new CategoryController();

router.post('/', validate(createCategorySchema), categoryController.create);
router.get('/', categoryController.getAll);
router.get('/:slug', categoryController.getBySlug);
router.put('/:id', validate(updateCategorySchema), categoryController.update);
router.delete('/:id', categoryController.delete);

export default router;
