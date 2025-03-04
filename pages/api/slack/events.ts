import type { NextApiRequest, NextApiResponse } from 'next';
import { logDebug } from './debug';

const DEBUG = true;

type SlackEvent = {
  type: string;
  text?: string;
  user?: string;
  channel?: string;
  ts?: string;
}

type SlackEventPayload = {
  token: string;
  challenge?: string;
  type: string;
  event?: SlackEvent;
  team_id?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({ ok: true });

  try {
    const payload = req.body;
    
    if (payload.type === 'event_callback' && payload.event?.type === 'app_mention') {
      const event = payload.event;
      
      // メンションとタイムスタンプ、名前を除去
      const text = event.text
        .replace(/<@[A-Z0-9]+>/g, '')  // メンションを削除
        .replace(/\[\d{2}:\d{2}\].*?\n+/g, '')  // タイムスタンプと名前の行を削除
        .trim();  // 余分な空白を削除

      await logDebug({
        type: 'test_response',
        text: text,
        channel: event.channel
      });

      // テスト用の固定応答
      const response = `テストメッセージです。あなたのメッセージ: ${text}`;
      
      // Slackにメッセージを送信
      const result = await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SLACK_BOT_TOKEN}`
        },
        body: JSON.stringify({
          channel: event.channel,
          text: response
        })
      });

      await logDebug({
        type: 'slack_response',
        status: result.status,
        response: await result.json()
      });
    }
  } catch (err) {
    const error = err as Error;
    await logDebug({
      type: 'error',
      message: error.message,
      stack: error.stack
    });
  }
} 