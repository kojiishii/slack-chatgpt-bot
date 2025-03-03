mport type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('API endpoint hit:', new Date().toISOString());
  
  res.status(200).json({ 
    text: 'Hello from updated API',
    timestamp: new Date().toISOString()
  });
}
