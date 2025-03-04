import type { NextApiRequest, NextApiResponse } from 'next';
import { logDebug } from './debug';

const DEBUG = true;

type SlackEvent = {
  type: string;
  text?: string;
  user?: string;
  channel?: string;
  ts?: string;
  bot_id?: string;
  subtype?: string;
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
    
    if (payload.type === 'event_callback') {
      const event = payload.event;

      if (event.type === 'message' && !event.bot_id) {
        // 現在のタイムスタンプと比較（3秒以内のメッセージは無視）
        const eventTime = parseFloat(event.ts);
        const now = Date.now() / 1000;
        
        if (now - eventTime > 3) {
          await logDebug({
            type: 'old_message_skipped',
            eventTime,
            now,
            diff: now - eventTime
          });
          return;
        }

        await logDebug({
          type: 'processing_message',
          text: event.text,
          user: event.user,
          channel: event.channel,
          eventTime,
          now
        });

        try {
          // トークンの存在確認
          if (!process.env.SLACK_BOT_TOKEN) {
            throw new Error('SLACK_BOT_TOKEN is not set');
          }

          const response = `テストメッセージです。あなたのメッセージ: ${event.text}`;
          
          await logDebug({
            type: 'sending_message',
            text: response,
            channel: event.channel,
            token_exists: !!process.env.SLACK_BOT_TOKEN
          });

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

          // レスポンスの詳細をログ出力
          const responseText = await result.text();
          await logDebug({
            type: 'slack_api_response',
            status: result.status,
            headers: Object.fromEntries(result.headers),
            response: responseText
          });

          const slackResponse = JSON.parse(responseText);
          if (!slackResponse.ok) {
            throw new Error(`Slack API error: ${slackResponse.error}`);
          }
        } catch (error) {
          const sendError = error as Error;
          await logDebug({
            type: 'send_error',
            error: sendError.message,
            stack: sendError.stack
          });
        }
      }
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