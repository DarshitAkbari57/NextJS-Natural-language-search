import { NextApiRequest, NextApiResponse } from 'next';
import { withDB } from '@/backend/lib/withDB';
import { bulkCreateProducts } from '@/backend/controllers/productController';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  return bulkCreateProducts(req, res);
}

export default withDB(handler);
