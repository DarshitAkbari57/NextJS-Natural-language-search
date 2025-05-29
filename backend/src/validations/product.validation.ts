import Joi from 'joi';

export const searchProductSchema = Joi.object({
  query: Joi.string().allow(''),
  filters: Joi.object().default({}),
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(100).default(10),
});

export const createProductSchema = Joi.object({
  title: Joi.string().required().min(3).max(200),
  description: Joi.string().required().min(10),
  price: Joi.number().required().min(0),
  location: Joi.object({
    city: Joi.string().required(),
    state: Joi.string().required(),
    country: Joi.string().required(),
  }).required(),
  categoryId: Joi.string()
    .required()
    .regex(/^[0-9a-fA-F]{24}$/),
  attributes: Joi.object().required(),
});

export const updateProductSchema = createProductSchema
  .keys({
    title: Joi.string().min(3).max(200),
    description: Joi.string().min(10),
    price: Joi.number().min(0),
    location: Joi.object({
      city: Joi.string(),
      state: Joi.string(),
      country: Joi.string(),
    }),
    categoryId: Joi.string().regex(/^[0-9a-fA-F]{24}$/),
    attributes: Joi.object(),
  })
  .min(1);
