import { NextApiRequest, NextApiResponse } from 'next';
import { withDB } from '@/backend/lib/withDB';
import { deleteProduct } from '@/backend/controllers/productController';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  return deleteProduct(req, res);
}

export default withDB(handler);
