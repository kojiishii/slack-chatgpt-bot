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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log('Received request:', req.body);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // チャレンジリクエストの処理
  if (req.body.type === 'url_verification') {
    return res.status(200).json({ challenge: req.body.challenge });
  }

  // 重複イベントを防ぐために、まず200 OKを返す
  res.status(200).json({ ok: true });

  try {
    if (req.body.event?.type === 'app_mention') {
      console.log('Received mention:', req.body.event);
      
      const { text, channel, ts } = req.body.event;
      
      try {
        const completion = await openai.chat.completions.create({
          messages: [{ role: 'user', content: text }],
          model: 'gpt-3.5-turbo',
        });

        await app.client.chat.postMessage({
          channel: channel,
          thread_ts: ts, // スレッドで返信
          text: completion.choices[0].message.content || '申し訳ありません。応答を生成できませんでした。',
        });
      } catch (error: any) {
        let errorMessage = '申し訳ありません。エラーが発生しました。';
        
        if (error?.code === 'insufficient_quota') {
          errorMessage = '申し訳ありません。現在APIの利用制限に達しています。しばらく時間をおいてから再度お試しください。';
        }

        await app.client.chat.postMessage({
          channel: channel,
          thread_ts: ts, // スレッドで返信
          text: errorMessage,
        });
      }
    }
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 