import mongoose, { Schema, Document } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  slug: string;
  attributeSchema: {
    [key: string]: {
      type: string;
      required: boolean;
      options?: string[];
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true },
    attributeSchema: {
      type: Map,
      of: {
        type: { type: String, required: true },
        required: { type: Boolean, default: false },
        options: [String],
      },
      required: true,
    },
  },
  { timestamps: true },
);

categorySchema.pre('save', function (next) {
  if (this.isModified('name')) {
    this.slug = this.name.toLowerCase().replace(/\s+/g, '-');
  }
  next();
});

export const Category = mongoose.model<ICategory>('Category', categorySchema);
