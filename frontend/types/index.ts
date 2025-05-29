export interface Product {
  _id: string;
  name: string;
  category: string;
  subcategory?: string;
  price: number;
  priceUnit?: string;
  description?: string;
  location?: {
    city?: string;
    state?: string;
    country?: string;
  };
  attributes?: Map<string, any>;
  tags?: string[];
  brand?: string;
  isOrganic?: boolean;
  specifications?: Map<string, any>;
}
