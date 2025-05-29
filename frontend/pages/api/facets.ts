import { NextApiRequest, NextApiResponse } from 'next';
import { withDB } from '@/backend/lib/withDB';
import { getFacets } from '../../backend/controllers/facetController';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  return getFacets(req, res);
}

export default withDB(handler);
