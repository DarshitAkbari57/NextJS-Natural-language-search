import { Router } from 'express';
import { ProductController } from '../controllers/product.controller';
import { validate } from '../middlewares/validate';
import {
  searchProductSchema,
  createProductSchema,
  updateProductSchema,
} from '../validations/product.validation';

const router = Router();
const productController = new ProductController();

router.post('/search', validate(searchProductSchema), productController.search);

router.post('/', validate(createProductSchema), productController.create);
router.get('/', productController.getAll);
router.get('/:id', productController.getById);
router.put('/:id', validate(updateProductSchema), productController.update);
router.delete('/:id', productController.delete);

export default router;
