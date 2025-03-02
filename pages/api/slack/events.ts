import { NextApiRequest, NextApiResponse } from 'next';
import { App } from '@slack/bolt';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
});

// デバッグ用のログ
console.log('API Handler loaded');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // リクエストの内容をログに出力
  console.log('Request received:', {
    method: req.method,
    body: req.body,
    type: req.body?.type
  });

  // POSTメソッド以外は拒否
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // URL検証リクエストの処理
  if (req.body && req.body.type === 'url_verification') {
    console.log('Challenge received:', req.body.challenge);
    return res.status(200).json({ challenge: req.body.challenge });
  }

  // その他のリクエストには200 OKを返す
  return res.status(200).json({ ok: true });
} 