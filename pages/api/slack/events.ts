import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // メソッドを確認
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 常に200 OKを返す
  return res.status(200).json({ 
    ok: true,
    method: req.method,
    timestamp: new Date().toISOString()
  });
} 