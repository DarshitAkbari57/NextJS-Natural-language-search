import mongoose, { Schema, model, models } from 'mongoose';

const productSchema = new Schema(
  {
    name: { type: String, required: true },
    category: { type: String, required: true },
    subcategory: String,
    price: { type: Number, required: true },
    priceUnit: { type: String, default: 'kg' },
    description: String,
    location: {
      city: String,
      state: String,
      country: { type: String, default: 'India' },
    },
    attributes: {
      type: Map,
      of: Schema.Types.Mixed,
    },
    tags: [String],
    brand: String,
    isOrganic: Boolean,
    specifications: {
      type: Map,
      of: Schema.Types.Mixed,
    },
  },
  { timestamps: true },
);

productSchema.index({
  name: 'text',
  description: 'text',
  tags: 'text',
  'attributes.value': 'text',
});

export const Product = models.Product || model('Product', productSchema);
