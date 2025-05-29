import { NextApiRequest, NextApiResponse } from 'next';
import { withDB } from '@/backend/lib/withDB';
import { updateProduct } from '@/backend/controllers/productController';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  return updateProduct(req, res);
}

export default withDB(handler);
