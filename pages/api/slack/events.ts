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
  event_id?: string;
}

// 処理済みのイベントIDを保持する配列（最大100件）
const processedEventIds: string[] = [];
const MAX_PROCESSED_EVENTS = 100;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const payload = req.body;

    // チャレンジリクエストの処理
    if (payload.type === 'url_verification') {
      return res.status(200).json({ challenge: payload.challenge });
    }

    // イベントの重複チェック
    if (payload.type === 'event_callback') {
      const eventId = payload.event_id;

      await logDebug({
        type: 'event_received',
        eventId,
        payload_type: payload.type,
        is_duplicate: processedEventIds.includes(eventId)
      });

      // 重複イベントをスキップ
      if (processedEventIds.includes(eventId)) {
        return res.status(200).json({ ok: true, info: 'duplicate_event_skipped' });
      }

      // イベントIDを記録
      processedEventIds.push(eventId);
      if (processedEventIds.length > MAX_PROCESSED_EVENTS) {
        processedEventIds.shift(); // 古いイベントIDを削除
      }

      const event = payload.event;

      if (event.type === 'message' && !event.bot_id && !event.subtype) {
        // 現在のタイムスタンプと比較（3秒以内のメッセージのみ処理）
        const eventTime = parseFloat(event.ts);
        const now = Date.now() / 1000;
        
        if (now - eventTime > 3) {
          await logDebug({
            type: 'old_message_skipped',
            eventId,
            eventTime,
            now,
            diff: now - eventTime
          });
          return res.status(200).json({ ok: true, info: 'old_message_skipped' });
        }

        try {
          if (!process.env.SLACK_BOT_TOKEN) {
            throw new Error('SLACK_BOT_TOKEN is not set');
          }

          const response = `テストメッセージです。あなたのメッセージ: ${event.text}`;
          
          await logDebug({
            type: 'sending_message',
            eventId,
            text: response,
            channel: event.channel
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

          const slackResponse = await result.json();
          await logDebug({
            type: 'slack_api_response',
            eventId,
            status: result.status,
            response: slackResponse
          });
        } catch (error) {
          const sendError = error as Error;
          await logDebug({
            type: 'send_error',
            eventId,
            error: sendError.message
          });
          return res.status(500).json({ ok: false, error: sendError.message });
        }
      }
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    const error = err as Error;
    await logDebug({
      type: 'error',
      message: error.message,
      stack: error.stack
    });
    return res.status(500).json({ ok: false, error: error.message });
  }
} 