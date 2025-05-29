import { NextApiRequest, NextApiResponse } from 'next';
import { withDB } from '@/backend/lib/withDB';
import { createProduct } from '@/backend/controllers/productController';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  return createProduct(req, res);
}

export default withDB(handler);