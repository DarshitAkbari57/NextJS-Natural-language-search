import Joi from 'joi';

export const createCategorySchema = Joi.object({
  name: Joi.string().required().min(2).max(50),
  attributeSchema: Joi.object()
    .pattern(
      Joi.string(),
      Joi.object({
        type: Joi.string().valid('string', 'number', 'boolean', 'array').required(),
        required: Joi.boolean().default(false),
        options: Joi.array().items(Joi.string()),
      }),
    )
    .required(),
});

export const updateCategorySchema = createCategorySchema.keys({
  name: Joi.string().min(2).max(50),
  attributeSchema: Joi.object().pattern(
    Joi.string(),
    Joi.object({
      type: Joi.string().valid('string', 'number', 'boolean', 'array'),
      required: Joi.boolean(),
      options: Joi.array().items(Joi.string()),
    }),
  ),
});
