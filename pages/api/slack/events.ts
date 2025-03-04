import type { NextApiRequest, NextApiResponse } from 'next';
import { getChatGPTResponse } from '../../../utils/openai';
import { sendSlackMessage } from '../../../utils/slack';
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
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 最初にリクエストをログ出力
  console.log('=== START REQUEST ===');
  console.log('Request received:', {
    method: req.method,
    headers: req.headers,
    body: JSON.stringify(req.body, null, 2)
  });

  // イベントをデバッグログに記録
  await logDebug({
    type: 'incoming_request',
    method: req.method,
    body: req.body
  });

  const payload = req.body;

  // ペイロードの種類をログ出力
  console.log('Payload type:', payload.type);

  // チャレンジレスポンスの処理
  if (payload.type === 'url_verification') {
    await logDebug({
      type: 'url_verification',
      challenge: payload.challenge
    });
    return res.status(200).json({ challenge: payload.challenge });
  }

  if (payload.type === 'event_callback') {
    await logDebug({
      type: 'event_callback',
      event: payload.event,
      timestamp: new Date()
    });
    console.log('Event received:', {
      type: payload.event?.type,
      channel_type: payload.event?.channel_type,
      text: payload.event?.text,
      user: payload.event?.user
    });

    // イベント処理の前後でログ
    try {
      const response = await getChatGPTResponse(payload.event.text);
      console.log('ChatGPT response:', response);
      await sendSlackMessage(payload.event.channel, response);
      console.log('Message sent to Slack');
    } catch (error) {
      console.error('Error processing event:', error);
    }
  }

  console.log('=== END REQUEST ===');
  return res.status(200).json({ ok: true });
} 