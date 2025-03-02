import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({ 
    message: 'Slack API test is working',
    method: req.method,
    path: '/api/slack/test'
  });
} 